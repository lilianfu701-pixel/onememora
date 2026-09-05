import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import {
  auditLogs,
  deceasedPeople,
  memorialLocations,
  memorialMembers,
  memorialNames,
  memorialRelatives,
  memorials,
  outboxEvents,
  relationshipClaims,
} from "@/db/schema";
import { err, ok } from "@/lib/result";
import type { Result } from "@/lib/result";
import type { Actor, MemorialRole } from "@/modules/permissions/types";
import { buildMemorialSlug, buildMemorialNumber } from "./slug";

/** The wording of the responsibility statement the creator accepted. */
export const RELATIONSHIP_STATEMENT_VERSION = "2026-07-29.v1";

export type Relationship =
  | "spouse"
  | "parent"
  | "child"
  | "sibling"
  | "husband"
  | "wife"
  | "father"
  | "mother"
  | "paternal_grandfather"
  | "paternal_grandmother"
  | "maternal_grandfather"
  | "maternal_grandmother"
  | "son"
  | "daughter"
  | "older_sister"
  | "older_brother"
  | "younger_brother"
  | "younger_sister";

export type DatePrecision = "day" | "month" | "year" | "approximate" | "unknown";

export type PartialDate = {
  /** ISO date. Components finer than the precision are placeholders. */
  value: string | null;
  precision: DatePrecision;
};

export type CreateMemorialInput = {
  relationship: Relationship;
  relationshipStatementAccepted: boolean;
  primaryName: { value: string; locale?: string | undefined; script?: string | undefined };
  aliases?:
    | {
        value: string;
        locale?: string | undefined;
        script?: string | undefined;
        type?: "former" | "native" | "transliteration" | "alias" | undefined;
        searchable?: boolean | undefined;
      }[]
    | undefined;
  birthDate?: PartialDate | undefined;
  deathDate?: PartialDate | undefined;
  locations?:
    | {
        kind: "birth" | "death" | "lived" | "resting_place";
        country?: string | undefined;
        region?: string | undefined;
        city?: string | undefined;
      }[]
    | undefined;
  ancestralHometown?: string | undefined;
  faith?: string | undefined;
  causeOfDeath?: string | undefined;
  relatives?:
    | {
        name: string;
        relationshipToDeceased: string;
        isDeceased: boolean;
        showFullName?: boolean | undefined;
      }[]
    | undefined;
  /*
   * People the creator wants to co-manage the memorial, named rather than
   * emailed. Many families do not know each other's addresses, so a co-creator
   * is recorded by name and relationship and linked when that person registers
   * and is recognized. Stored as relative rows so the existing recognition-claim
   * flow can match them.
   */
  coCreators?:
    | {
        name: string;
        relationshipToDeceased: string;
      }[]
    | undefined;
  visibility?: "public" | "unlisted" | "invite_only" | undefined;
  searchEngineIndexable?: boolean | undefined;
  /**
   * Platform staff creating a page on a family's behalf, to be claimed later.
   * Honoured only when the actor is an admin. Skips the relationship/declaration
   * (staff are not family) and marks the page as stewarded, which closes the
   * paid offerings until a family claims it.
   */
  asAdminSteward?: boolean | undefined;
};

export type CreateMemorialError =
  | "AUTH_REQUIRED"
  | "RELATIONSHIP_NOT_ELIGIBLE"
  | "STATEMENT_NOT_ACCEPTED"
  | "INVALID_NAME"
  | "INVALID_DATES";

const ELIGIBLE_RELATIONSHIPS: readonly Relationship[] = [
  "spouse",
  "parent",
  "child",
  "husband",
  "wife",
  "father",
  "mother",
  "paternal_grandfather",
  "paternal_grandmother",
  "maternal_grandfather",
  "maternal_grandmother",
  "son",
  "daughter",
];

/**
 * Creates a memorial.
 *
 * The deceased record, the memorial, the owner's membership, the relationship
 * claim, the audit entry and the `memorial.created` outbox event are one
 * transaction. A half-created memorial with no owner would be unreachable by
 * the person who made it and unmanageable by anyone else.
 *
 * The caller supplies an idempotency key. A retry after a dropped connection
 * returns the memorial that was already made instead of a second one.
 */
export async function createMemorial(
  actor: Actor,
  input: CreateMemorialInput,
  idempotencyKey: string,
  correlationId: string,
): Promise<
  Result<
    { memorialId: string; slug: string; created: boolean },
    CreateMemorialError
  >
> {
  const userId = actor.userId;
  if (!userId) {
    return err("AUTH_REQUIRED");
  }

  // Platform staff may create a page for a family to claim; only a real admin
  // account can, and it skips the family-only relationship declaration.
  const isSteward =
    Boolean(input.asAdminSteward) && actor.platformRole !== "user";

  if (!isSteward) {
    if (!ELIGIBLE_RELATIONSHIPS.includes(input.relationship)) {
      return err("RELATIONSHIP_NOT_ELIGIBLE");
    }

    // Doc 01 section 3.1: the declaration is a step of its own, not a checkbox
    // we can infer from the request having been sent.
    if (!input.relationshipStatementAccepted) {
      return err("STATEMENT_NOT_ACCEPTED");
    }
  }

  const primaryName = input.primaryName.value.trim();
  if (primaryName.length === 0) {
    return err("INVALID_NAME");
  }

  if (!datesAreOrdered(input.birthDate, input.deathDate)) {
    return err("INVALID_DATES");
  }

  const existing = await findByIdempotencyKey(userId, idempotencyKey);
  if (existing) {
    // A replay, not a second bereavement. The caller answers 200 rather than
    // 201 so a client can tell the two apart. See doc 04 section 2.
    return ok({ ...existing, created: false });
  }

  // Number first: the slug's suffix IS the public number, so there is one
  // number for the page — in the URL, on the page, and to search by.
  const publicNumber = await allocateMemorialNumber();
  const slug = buildMemorialSlug(primaryName, publicNumber);

  const created = await db()
    .transaction(async (tx) => {
    const [person] = await tx
      .insert(deceasedPeople)
      .values({
        birthDate: input.birthDate?.value ?? null,
        birthDatePrecision: input.birthDate?.precision ?? "unknown",
        deathDate: input.deathDate?.value ?? null,
        deathDatePrecision: input.deathDate?.precision ?? "unknown",
        ancestralHometown: input.ancestralHometown?.trim() || null,
        faith: input.faith?.trim() || null,
        causeOfDeath: input.causeOfDeath?.trim() || null,
      })
      .returning({ id: deceasedPeople.id });

    if (!person) {
      throw new Error("deceased person insert returned no row");
    }

    const [memorial] = await tx
      .insert(memorials)
      .values({
        deceasedPersonId: person.id,
        slug,
        publicNumber,
        status: "draft",
        visibility: input.visibility ?? "public",
        searchEngineIndexable: input.searchEngineIndexable ?? true,
        ownerUserId: userId,
        stewardedByAdminAt: isSteward ? new Date() : null,
        creationIdempotencyKey: idempotencyKey,
      })
      .returning({ id: memorials.id, slug: memorials.slug });

    if (!memorial) {
      throw new Error("memorial insert returned no row");
    }

    await tx.insert(memorialNames).values({
      memorialId: memorial.id,
      value: primaryName,
      locale: input.primaryName.locale ?? null,
      script: input.primaryName.script ?? null,
      type: "primary",
      searchable: true,
    });

    for (const alias of input.aliases ?? []) {
      const value = alias.value.trim();
      if (value.length === 0) continue;
      await tx.insert(memorialNames).values({
        memorialId: memorial.id,
        value,
        locale: alias.locale ?? null,
        script: alias.script ?? null,
        type: alias.type ?? "alias",
        // A family may record a former name without making it findable.
        searchable: alias.searchable ?? true,
      });
    }

    for (const location of input.locations ?? []) {
      await tx.insert(memorialLocations).values({
        memorialId: memorial.id,
        kind: location.kind,
        country: location.country ?? null,
        region: location.region ?? null,
        city: location.city ?? null,
      });
    }

    // Tracks (name|relationship) already stored so a co-creator who is also in
    // the relatives list is not written twice.
    const seenRelatives = new Set<string>();
    let relativeOrder = 0;

    for (const rel of input.relatives ?? []) {
      const relName = rel.name.trim();
      if (relName.length === 0) continue;
      const dedupeKey = `${relName} ${rel.relationshipToDeceased}`;
      if (seenRelatives.has(dedupeKey)) continue;
      seenRelatives.add(dedupeKey);
      await tx.insert(memorialRelatives).values({
        memorialId: memorial.id,
        name: relName,
        relationshipToDeceased: rel.relationshipToDeceased,
        isDeceased: rel.isDeceased,
        showFullName: rel.showFullName ?? rel.isDeceased,
        displayOrder: relativeOrder++,
      });
    }

    // Co-creators are living family who will manage the memorial once they
    // register; recorded here as relatives (masked, living) so the recognition
    // flow can link them by name and relationship.
    for (const co of input.coCreators ?? []) {
      const coName = co.name.trim();
      if (coName.length === 0 || co.relationshipToDeceased.length === 0) continue;
      const dedupeKey = `${coName} ${co.relationshipToDeceased}`;
      if (seenRelatives.has(dedupeKey)) continue;
      seenRelatives.add(dedupeKey);
      await tx.insert(memorialRelatives).values({
        memorialId: memorial.id,
        name: coName,
        relationshipToDeceased: co.relationshipToDeceased,
        isDeceased: false,
        showFullName: false,
        displayOrder: relativeOrder++,
      });
    }

    await tx.insert(memorialMembers).values({
      memorialId: memorial.id,
      userId,
      role: "owner" satisfies MemorialRole,
      acceptedAt: new Date(),
    });

    // A family creator declares their relationship; a platform steward does not
    // (they are not family), so no relationship claim is recorded for them.
    if (!isSteward) {
      await tx.insert(relationshipClaims).values({
        memorialId: memorial.id,
        claimantUserId: userId,
        relationship: input.relationship,
        statementVersion: RELATIONSHIP_STATEMENT_VERSION,
        status: "declared",
      });
    }

    await tx.insert(auditLogs).values({
      actorUserId: userId,
      action: isSteward ? "memorial.created_stewarded" : "memorial.created",
      resourceType: "memorial",
      resourceId: memorial.id,
      newValue: {
        slug: memorial.slug,
        visibility: input.visibility ?? "public",
        relationship: isSteward ? "platform_steward" : input.relationship,
      },
      correlationId,
    });

    await tx.insert(outboxEvents).values({
      topic: "memorial.created",
      aggregateId: memorial.id,
      payload: {
        memorialId: memorial.id,
        idempotencyKey,
        ownerUserId: userId,
        correlationId,
      },
    });

      return { memorialId: memorial.id, slug: memorial.slug, created: true };
    })
    .catch(async (error: unknown) => {
      // A retry that arrived while the first request was still committing loses
      // the race on the unique index. That is the mechanism working: return the
      // memorial the winner created rather than reporting a conflict.
      if (isUniqueViolation(error)) {
        const raced = await findByIdempotencyKey(userId, idempotencyKey);
        if (raced) {
          return { ...raced, created: false };
        }
      }
      throw error;
    });

  return ok(created);
}

/**
 * Picks a free 8-digit public number. The number is random over a 90-million
 * space, so at the platform's scale the first candidate is almost always free;
 * we still check a handful and let the unique index be the final guard.
 */
async function allocateMemorialNumber(): Promise<string> {
  for (let i = 0; i < 8; i += 1) {
    const candidate = buildMemorialNumber();
    const [taken] = await db()
      .select({ id: memorials.id })
      .from(memorials)
      .where(eq(memorials.publicNumber, candidate))
      .limit(1);
    if (!taken) return candidate;
  }
  // Astronomically unlikely; fall back to one more candidate and rely on the
  // unique index. A collision here surfaces as a creation error the client retries.
  return buildMemorialNumber();
}

/**
 * Resolves a typed public number to a memorial slug. Any visibility resolves —
 * the number is like a shared link; the memorial page's own access check decides
 * whether the visitor may see it. Deleted memorials do not resolve.
 */
export async function findSlugByPublicNumber(
  publicNumber: string,
): Promise<string | null> {
  const cleaned = publicNumber.trim();
  if (!/^\d{6,8}$/.test(cleaned)) return null;
  const [row] = await db()
    .select({ slug: memorials.slug })
    .from(memorials)
    .where(
      and(
        eq(memorials.publicNumber, cleaned),
        isNull(memorials.deletionRequestedAt),
      ),
    )
    .limit(1);
  return row?.slug ?? null;
}

/**
 * Looks up a previous creation with the same key from the same person.
 *
 * The uniqueness is enforced by an index on (owner, key); this read is the fast
 * path that turns a retry into the original answer instead of a conflict.
 */
async function findByIdempotencyKey(
  userId: string,
  idempotencyKey: string,
): Promise<{ memorialId: string; slug: string } | null> {
  const [row] = await db()
    .select({ memorialId: memorials.id, slug: memorials.slug })
    .from(memorials)
    .where(
      and(
        eq(memorials.ownerUserId, userId),
        eq(memorials.creationIdempotencyKey, idempotencyKey),
      ),
    );

  return row ?? null;
}

/** PostgreSQL reports a violated unique index as SQLSTATE 23505. */
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}

/** Rejects a death recorded before a birth, when both are precise enough to compare. */
function datesAreOrdered(
  birth: PartialDate | undefined,
  death: PartialDate | undefined,
): boolean {
  if (!birth?.value || !death?.value) {
    return true;
  }

  // Approximate or unknown dates carry placeholder components, so comparing
  // them would reject legitimate records.
  if (
    birth.precision === "approximate" ||
    birth.precision === "unknown" ||
    death.precision === "approximate" ||
    death.precision === "unknown"
  ) {
    return true;
  }

  return new Date(birth.value).getTime() <= new Date(death.value).getTime();
}

export { memorialRoleFor } from "./membership";

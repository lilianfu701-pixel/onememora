import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  auditLogs,
  lifeChapters,
  memorialMembers,
  memorials,
  recognitionClaims,
  visitorSubmissions,
} from "@/db/schema";
import { err, ok } from "@/lib/result";
import type { Result } from "@/lib/result";
import type { Actor } from "@/modules/permissions/types";
import { contentMediaPhotos } from "@/modules/media/service";

const CONTRIBUTION_OWNER_TYPE = "contribution";

/** A guest may leave this many contributions on one memorial per hour. */
const GUEST_HOURLY_LIMIT = 5;
const ONE_HOUR_MS = 3_600_000;

export type ContributionError =
  | "MEMORIAL_NOT_FOUND"
  | "EMPTY_BODY"
  | "INVALID_CHAPTER"
  | "RATE_LIMITED";

export type ContributionPhoto = {
  mediaId: string;
  url: string | null;
  caption: string | null;
  status: string;
};

export type PublicContribution = {
  id: string;
  name: string | null;
  relation: string | null;
  body: string;
  chapterId: string | null;
  chapterKey: string | null;
  chapterCustomTitle: string | null;
  /** The contributor's identity was confirmed — show the "已认证亲友" badge. */
  verified: boolean;
  createdAt: Date;
  photos: ContributionPhoto[];
};

export type PendingContribution = PublicContribution;

/**
 * The identity standing of a signed-in person for this memorial.
 *
 * A confirmed recognition claim is the strong signal: the family has vouched
 * that this account is the listed relative, so we can name them from the claim
 * rather than trusting a free-text field. A member is trusted by their role.
 */
export type ContributorStanding = {
  verified: boolean;
  /** Authoritative name/relationship from a confirmed claim, when present. */
  name: string | null;
  relation: string | null;
};

export async function contributorStanding(
  userId: string | null,
  memorialId: string,
): Promise<ContributorStanding> {
  if (!userId) return { verified: false, name: null, relation: null };

  const [claim] = await db()
    .select({
      name: recognitionClaims.claimedName,
      relation: recognitionClaims.claimedRelationship,
    })
    .from(recognitionClaims)
    .where(
      and(
        eq(recognitionClaims.memorialId, memorialId),
        eq(recognitionClaims.claimantUserId, userId),
        eq(recognitionClaims.status, "confirmed"),
      ),
    )
    .orderBy(desc(recognitionClaims.decidedAt))
    .limit(1);

  if (claim) {
    return { verified: true, name: claim.name, relation: claim.relation };
  }

  // The owner and any active member are trusted by their role. We have no
  // relationship on record for them, so they keep whatever they type.
  const [owner] = await db()
    .select({ ownerUserId: memorials.ownerUserId })
    .from(memorials)
    .where(eq(memorials.id, memorialId))
    .limit(1);
  if (owner?.ownerUserId === userId) {
    return { verified: true, name: null, relation: null };
  }

  const [member] = await db()
    .select({ userId: memorialMembers.userId })
    .from(memorialMembers)
    .where(
      and(
        eq(memorialMembers.memorialId, memorialId),
        eq(memorialMembers.userId, userId),
        isNull(memorialMembers.revokedAt),
      ),
    )
    .limit(1);

  return { verified: Boolean(member), name: null, relation: null };
}

async function photosByOwner(
  ids: string[],
  readyOnly: boolean,
): Promise<Map<string, ContributionPhoto[]>> {
  const map = new Map<string, ContributionPhoto[]>();
  if (ids.length === 0) return map;
  const rows = await contentMediaPhotos(CONTRIBUTION_OWNER_TYPE, ids, {
    readyOnly,
  });
  for (const p of rows) {
    const list = map.get(p.ownerId) ?? [];
    list.push({
      mediaId: p.mediaId,
      url: p.url,
      caption: p.caption,
      status: p.status,
    });
    map.set(p.ownerId, list);
  }
  return map;
}

/**
 * Records a friend-or-family contribution (a story, with photos to follow).
 *
 * Held as a pending visitor submission until the family reviews it — nothing
 * here reaches the public page on its own. A signed-in contributor is named by
 * their account; a guest may leave a text contribution, rate-limited by IP so
 * the door that is open to everyone cannot be used to flood the page.
 */
export async function submitContribution(
  actor: Actor,
  memorialId: string,
  input: {
    name?: string | null;
    relation?: string | null;
    body: string;
    sourceLocale: string;
    chapterId?: string | null;
  },
  context: { requestIpHash: string | null },
  correlationId: string,
): Promise<
  Result<
    { submissionId: string; status: "published" | "pending_review" },
    ContributionError
  >
> {
  const [memorial] = await db()
    .select({ status: memorials.status })
    .from(memorials)
    .where(eq(memorials.id, memorialId));

  if (!memorial || memorial.status !== "published") {
    return err("MEMORIAL_NOT_FOUND");
  }

  const body = input.body.trim();
  if (body.length === 0) {
    return err("EMPTY_BODY");
  }

  if (input.chapterId) {
    const [chapter] = await db()
      .select({ id: lifeChapters.id })
      .from(lifeChapters)
      .where(
        and(
          eq(lifeChapters.id, input.chapterId),
          eq(lifeChapters.memorialId, memorialId),
          isNull(lifeChapters.deletedAt),
        ),
      );
    if (!chapter) {
      return err("INVALID_CHAPTER");
    }
  }

  // Identity standing decides the trust level: a verified contributor (a
  // confirmed recognition claim, or a member) is named from the record and
  // published without review; everyone else is a self-declared name held for
  // the family to read first.
  const standing = await contributorStanding(actor.userId, memorialId);
  const verified = standing.verified;
  const name = standing.name ?? (input.name?.trim() || null);
  const relation = standing.relation ?? (input.relation?.trim() || null);

  // A guest — no account — is rate-limited by IP so an open door is not an open
  // floodgate. A signed-in contributor is accountable by their account instead.
  if (!actor.userId) {
    const since = new Date(Date.now() - ONE_HOUR_MS);
    const [recent] = await db()
      .select({ n: sql<number>`count(*)::int` })
      .from(visitorSubmissions)
      .where(
        and(
          eq(visitorSubmissions.memorialId, memorialId),
          eq(visitorSubmissions.isContribution, true),
          context.requestIpHash
            ? eq(visitorSubmissions.contributorIpHash, context.requestIpHash)
            : sql`false`,
          gt(visitorSubmissions.createdAt, since),
        ),
      );
    if ((recent?.n ?? 0) >= GUEST_HOURLY_LIMIT) {
      return err("RATE_LIMITED");
    }
  }

  const [row] = await db()
    .insert(visitorSubmissions)
    .values({
      memorialId,
      submitterUserId: actor.userId ?? null,
      kind: "story",
      body,
      sourceLocale: input.sourceLocale,
      // A verified contributor is trusted enough to appear at once.
      status: verified ? "published" : "pending_review",
      audience: "public",
      isContribution: true,
      contributorVerified: verified,
      contributorName: name,
      contributorRelation: relation,
      chapterId: input.chapterId ?? null,
      contributorIpHash: actor.userId ? null : context.requestIpHash,
      ...(verified ? { moderatedAt: new Date() } : {}),
    })
    .returning({ id: visitorSubmissions.id });

  if (!row) {
    throw new Error("contribution insert returned no row");
  }

  await db().insert(auditLogs).values({
    actorUserId: actor.userId,
    action: "contribution.created",
    resourceType: "visitor_submission",
    resourceId: row.id,
    newValue: {
      memorialId,
      hasChapter: input.chapterId != null,
      verified,
      autoPublished: verified,
    },
    correlationId,
  });

  return ok({
    submissionId: row.id,
    status: verified ? "published" : "pending_review",
  });
}

function toPublic(
  rows: {
    id: string;
    name: string | null;
    relation: string | null;
    body: string;
    chapterId: string | null;
    chapterKey: string | null;
    chapterCustomTitle: string | null;
    verified: boolean;
    createdAt: Date;
  }[],
  photos: Map<string, ContributionPhoto[]>,
): PublicContribution[] {
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    relation: r.relation,
    body: r.body,
    chapterId: r.chapterId,
    chapterKey: r.chapterKey,
    chapterCustomTitle: r.chapterCustomTitle,
    verified: r.verified,
    createdAt: r.createdAt,
    photos: photos.get(r.id) ?? [],
  }));
}

const selectShape = {
  id: visitorSubmissions.id,
  name: visitorSubmissions.contributorName,
  relation: visitorSubmissions.contributorRelation,
  body: visitorSubmissions.body,
  chapterId: visitorSubmissions.chapterId,
  chapterKey: lifeChapters.chapterKey,
  chapterCustomTitle: lifeChapters.customTitle,
  verified: visitorSubmissions.contributorVerified,
  createdAt: visitorSubmissions.createdAt,
};

/** Approved contributions a public reader may see, newest first. */
export async function listPublicContributions(
  memorialId: string,
): Promise<PublicContribution[]> {
  const rows = await db()
    .select(selectShape)
    .from(visitorSubmissions)
    .leftJoin(lifeChapters, eq(lifeChapters.id, visitorSubmissions.chapterId))
    .where(
      and(
        eq(visitorSubmissions.memorialId, memorialId),
        eq(visitorSubmissions.isContribution, true),
        eq(visitorSubmissions.status, "published"),
      ),
    )
    .orderBy(desc(visitorSubmissions.createdAt))
    .limit(100);

  const photos = await photosByOwner(
    rows.map((r) => r.id),
    true,
  );
  return toPublic(rows, photos);
}

/** Contributions awaiting the family's review. */
export async function listPendingContributions(
  memorialId: string,
): Promise<PendingContribution[]> {
  const rows = await db()
    .select(selectShape)
    .from(visitorSubmissions)
    .leftJoin(lifeChapters, eq(lifeChapters.id, visitorSubmissions.chapterId))
    .where(
      and(
        eq(visitorSubmissions.memorialId, memorialId),
        eq(visitorSubmissions.isContribution, true),
        eq(visitorSubmissions.status, "pending_review"),
      ),
    )
    .orderBy(desc(visitorSubmissions.createdAt))
    .limit(200);

  const photos = await photosByOwner(
    rows.map((r) => r.id),
    false,
  );
  return toPublic(rows, photos);
}

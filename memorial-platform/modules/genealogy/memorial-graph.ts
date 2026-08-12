import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import {
  deceasedPeople,
  familyPeople,
  memorialNames,
  memorials,
} from "@/db/schema";
import { err, ok } from "@/lib/result";
import type { Result } from "@/lib/result";
import type { Actor } from "@/modules/permissions/types";
import { immediateLinks, proposeLink } from "./links";
import type { LinkError } from "./links";
import { addMemorialSubject } from "./people";
import type { AddPersonError } from "./people";

/** The other memorial's relationship to this one. */
export type MemorialRelation = "parent" | "spouse" | "child";

export type LinkMemorialsError = AddPersonError | LinkError | "SAME_MEMORIAL";

/**
 * Connects two memorials in the family graph with a relationship, from the
 * perspective of `memorialId`: `parent` means the other memorial is a parent of
 * this one, `child` means the other is this one's child, `spouse` a partner.
 *
 * Both subjects are placed in the graph first (idempotent). When the same
 * person stewards both — the ordinary case of one family building their own
 * tree — `proposeLink` confirms the edge immediately.
 */
export async function linkMemorials(
  actor: Actor,
  memorialId: string,
  otherMemorialId: string,
  relation: MemorialRelation,
  correlationId: string,
): Promise<Result<{ linkId: string; status: "proposed" | "confirmed" }, LinkMemorialsError>> {
  if (memorialId === otherMemorialId) {
    return err("SAME_MEMORIAL");
  }

  const self = await addMemorialSubject(actor, memorialId, correlationId);
  if (!self.ok) return err(self.error);

  const other = await addMemorialSubject(actor, otherMemorialId, correlationId);
  if (!other.ok) return err(other.error);

  const link = await proposeLink(
    actor,
    relation === "spouse"
      ? {
          kind: "partner",
          personId: self.value.personId,
          partnerId: other.value.personId,
        }
      : relation === "parent"
        ? {
            kind: "parent",
            parentId: other.value.personId,
            childId: self.value.personId,
          }
        : {
            kind: "parent",
            parentId: self.value.personId,
            childId: other.value.personId,
          },
    correlationId,
  );
  if (!link.ok) return err(link.error);

  return ok(link.value);
}

export type MemorialFamilyLink = {
  linkId: string;
  relation: MemorialRelation;
  name: string;
  slug: string;
};

/**
 * The confirmed family links of a memorial, resolved to the connected
 * memorials (name + slug) for display. Links to people who have no memorial
 * (placeholders, the living) are left out — there is nothing to link to.
 */
export async function memorialFamilyLinks(
  memorialId: string,
): Promise<MemorialFamilyLink[]> {
  const [memorial] = await db()
    .select({ deceasedPersonId: memorials.deceasedPersonId })
    .from(memorials)
    .where(eq(memorials.id, memorialId));
  if (!memorial) return [];

  const [person] = await db()
    .select({ id: familyPeople.id })
    .from(familyPeople)
    .where(eq(familyPeople.deceasedPersonId, memorial.deceasedPersonId));
  if (!person) return [];

  const links = await immediateLinks(person.id);
  if (links.length === 0) return [];

  // Resolve each other-person node to a memorial (name + slug).
  const others = await db()
    .select({
      personId: familyPeople.id,
      slug: memorials.slug,
      name: memorialNames.value,
    })
    .from(familyPeople)
    .innerJoin(
      deceasedPeople,
      eq(deceasedPeople.id, familyPeople.deceasedPersonId),
    )
    .innerJoin(memorials, eq(memorials.deceasedPersonId, deceasedPeople.id))
    .leftJoin(
      memorialNames,
      and(
        eq(memorialNames.memorialId, memorials.id),
        eq(memorialNames.type, "primary"),
      ),
    )
    .where(
      inArray(
        familyPeople.id,
        links.map((link) => link.otherPersonId),
      ),
    );

  const byPerson = new Map(others.map((row) => [row.personId, row]));

  const resolved: MemorialFamilyLink[] = [];
  for (const link of links) {
    const memorialRow = byPerson.get(link.otherPersonId);
    if (!memorialRow) continue;
    resolved.push({
      linkId: link.linkId,
      relation:
        link.role === "partner"
          ? "spouse"
          : link.role === "parent"
            ? "parent"
            : "child",
      name: memorialRow.name ?? "—",
      slug: memorialRow.slug,
    });
  }
  return resolved;
}

/* family graph: phase 1 (link own memorials); visual tree next */

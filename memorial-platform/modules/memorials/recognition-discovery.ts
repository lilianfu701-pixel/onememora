import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import {
  deceasedPeople,
  memorialMembers,
  memorialNames,
  memorialRelatives,
  memorials,
  recognitionClaims,
} from "@/db/schema";

type ClaimStatus =
  | "pending"
  | "escalated"
  | "confirmed"
  | "rejected"
  | "withdrawn";

/**
 * A public memorial that lists the signed-in person's own name as a relative.
 *
 * This is the "discovery" half of recognition: before anyone can claim an
 * identity, they have to be able to find where they were mentioned. Matching is
 * an exact-name match against the account holder's profile name — deliberately
 * conservative, since a loose match would surface strangers who happen to share
 * a name and invite false claims.
 */
export type Mention = {
  memorialId: string;
  slug: string;
  deceasedName: string | null;
  birthDate: string | null;
  deathDate: string | null;
  /** The relationship role the memorial recorded (e.g. `son`, `father`). */
  relationship: string;
  relativeName: string;
  /** This viewer's most recent claim on the memorial, if any. */
  claimStatus: ClaimStatus | null;
};

/**
 * Public memorials that list `fullName` as a relative and that the viewer is
 * not already part of.
 *
 * Memorials the viewer already belongs to are excluded — they don't need to
 * claim a place they already hold. Each surviving row carries the viewer's own
 * latest claim status so the UI can show "claim" vs. "awaiting confirmation".
 */
export async function discoverMentions(
  userId: string,
  fullName: string | null,
): Promise<Mention[]> {
  const name = fullName?.trim();
  if (!name) {
    return [];
  }

  // Memorials the viewer is already a member of (owner included) — nothing to
  // claim there.
  const memberRows = await db()
    .select({ memorialId: memorialMembers.memorialId })
    .from(memorialMembers)
    .where(
      and(
        eq(memorialMembers.userId, userId),
        isNull(memorialMembers.revokedAt),
      ),
    );
  const memberIds = new Set(memberRows.map((row) => row.memorialId));

  const rows = await db()
    .select({
      memorialId: memorials.id,
      slug: memorials.slug,
      deceasedName: memorialNames.value,
      birthDate: deceasedPeople.birthDate,
      deathDate: deceasedPeople.deathDate,
      relationship: memorialRelatives.relationshipToDeceased,
      relativeName: memorialRelatives.name,
      createdAt: memorialRelatives.createdAt,
    })
    .from(memorialRelatives)
    .innerJoin(memorials, eq(memorials.id, memorialRelatives.memorialId))
    .innerJoin(
      deceasedPeople,
      eq(deceasedPeople.id, memorials.deceasedPersonId),
    )
    .leftJoin(
      memorialNames,
      and(
        eq(memorialNames.memorialId, memorials.id),
        eq(memorialNames.type, "primary"),
      ),
    )
    .where(
      and(
        eq(memorialRelatives.name, name),
        eq(memorials.status, "published"),
        eq(memorials.visibility, "public"),
        isNull(memorials.deletionRequestedAt),
      ),
    )
    .orderBy(desc(memorialRelatives.createdAt));

  // The viewer's own claims, newest last so a re-claim after a rejection wins.
  const claimRows = await db()
    .select({
      memorialId: recognitionClaims.memorialId,
      status: recognitionClaims.status,
    })
    .from(recognitionClaims)
    .where(eq(recognitionClaims.claimantUserId, userId))
    .orderBy(recognitionClaims.createdAt);
  const claimByMemorial = new Map<string, ClaimStatus>();
  for (const claim of claimRows) {
    claimByMemorial.set(claim.memorialId, claim.status);
  }

  // One card per memorial even if the same name was recorded more than once.
  const seen = new Set<string>();
  const mentions: Mention[] = [];
  for (const row of rows) {
    if (memberIds.has(row.memorialId) || seen.has(row.memorialId)) {
      continue;
    }
    seen.add(row.memorialId);
    mentions.push({
      memorialId: row.memorialId,
      slug: row.slug,
      deceasedName: row.deceasedName,
      birthDate: row.birthDate,
      deathDate: row.deathDate,
      relationship: row.relationship,
      relativeName: row.relativeName,
      claimStatus: claimByMemorial.get(row.memorialId) ?? null,
    });
  }

  return mentions;
}

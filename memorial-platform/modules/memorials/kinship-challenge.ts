import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { memorialRelatives } from "@/db/schema";
import { normalizeForSearch } from "@/modules/search/normalize";

/**
 * A knowledge check for a recognition claim.
 *
 * A real family member can name close relatives; an impostor who only read the
 * public page cannot name one whose name is hidden. So the challenge asks the
 * claimant to name a relative recorded with `nameVisibility = 'hidden'` — never
 * shown on the page, signed in or not. Only the relationship is revealed (that
 * a spouse exists is not the secret; the name is).
 *
 * It never confirms a claim on its own — it only sets evidence the owner sees.
 */

/** A relationship that has at least one hidden relative to ask about. */
export async function pickKinshipChallenge(
  memorialId: string,
  excludeName: string,
): Promise<{ relationship: string } | null> {
  const rows = await db()
    .select({
      relationship: memorialRelatives.relationshipToDeceased,
      name: memorialRelatives.name,
      order: memorialRelatives.displayOrder,
    })
    .from(memorialRelatives)
    .where(
      and(
        eq(memorialRelatives.memorialId, memorialId),
        eq(memorialRelatives.nameVisibility, "hidden"),
      ),
    )
    .orderBy(asc(memorialRelatives.displayOrder));

  const exclude = normalizeForSearch(excludeName);
  const candidate = rows.find(
    (r) => normalizeForSearch(r.name) !== exclude && r.name.trim().length > 0,
  );

  return candidate ? { relationship: candidate.relationship } : null;
}

/** Whether two names are close enough to count as the same person. */
function namesMatch(a: string, b: string): boolean {
  const na = normalizeForSearch(a);
  const nb = normalizeForSearch(b);
  if (na.length < 2 || nb.length < 2) return false;
  if (na === nb) return true;
  // A given name against a full name, one script against its transliteration.
  return na.includes(nb) || nb.includes(na);
}

/**
 * Verifies an answer against the hidden relatives in the challenged
 * relationship. Any hidden relative of that relationship counts, so "name one
 * of the children" is forgiving when there are several.
 */
export async function verifyKinshipAnswer(
  memorialId: string,
  relationship: string,
  answer: string,
): Promise<boolean> {
  if (answer.trim().length === 0) return false;

  const rows = await db()
    .select({ name: memorialRelatives.name })
    .from(memorialRelatives)
    .where(
      and(
        eq(memorialRelatives.memorialId, memorialId),
        eq(memorialRelatives.relationshipToDeceased, relationship),
        eq(memorialRelatives.nameVisibility, "hidden"),
      ),
    );

  return rows.some((r) => namesMatch(answer, r.name));
}

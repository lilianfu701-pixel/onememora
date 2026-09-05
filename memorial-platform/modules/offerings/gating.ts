import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { memorials } from "@/db/schema";
import { err, ok } from "@/lib/result";
import type { Result } from "@/lib/result";

export type OfferingGateError =
  | "MEMORIAL_NOT_FOUND"
  /** Platform-created page not yet claimed by family — paid items are closed. */
  | "AWAITING_CLAIM"
  /** The family has switched this particular offering off. */
  | "OFFERING_DISABLED";

/** Offerings that cost money. A stewarded (unclaimed) page closes these. */
const PAID_SLUGS: ReadonlySet<string> = new Set([
  "candle",
  "wreath",
  "donation",
]);

/**
 * Decides whether an offering may be left on a memorial right now.
 *
 * Two independent gates: a platform-stewarded page (created by an admin,
 * awaiting a family claim) closes the paid offerings; and the family can switch
 * individual offerings off. Enforced server-side so hiding the buttons in the
 * UI is only a courtesy, never the control. Returns the memorial's slug so the
 * caller can build return URLs without a second query.
 */
export async function gateOffering(
  memorialId: string,
  slug: string,
): Promise<Result<{ memorialSlug: string }, OfferingGateError>> {
  const [memorial] = await db()
    .select({
      slug: memorials.slug,
      status: memorials.status,
      stewardedByAdminAt: memorials.stewardedByAdminAt,
      offeringsDisabled: memorials.offeringsDisabled,
    })
    .from(memorials)
    .where(eq(memorials.id, memorialId));

  if (!memorial || memorial.status !== "published") {
    return err("MEMORIAL_NOT_FOUND");
  }
  if (PAID_SLUGS.has(slug) && memorial.stewardedByAdminAt) {
    return err("AWAITING_CLAIM");
  }
  if ((memorial.offeringsDisabled ?? []).includes(slug)) {
    return err("OFFERING_DISABLED");
  }
  return ok({ memorialSlug: memorial.slug });
}

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { memorials } from "@/db/schema";

/** The offerings a family can switch on or off. Incense is free; the other
 * three cost money. All default to on. */
export const TOGGLEABLE_OFFERINGS = [
  "incense",
  "candle",
  "wreath",
  "donation",
] as const;

export type ToggleableOffering = (typeof TOGGLEABLE_OFFERINGS)[number];

/** The offering slugs the family has switched off on this memorial. */
export async function getOfferingsDisabled(
  memorialId: string,
): Promise<ToggleableOffering[]> {
  const [row] = await db()
    .select({ disabled: memorials.offeringsDisabled })
    .from(memorials)
    .where(eq(memorials.id, memorialId));
  return normalize(row?.disabled ?? []);
}

/** Replaces the disabled set. Unknown slugs are dropped so the column can only
 * ever hold real, toggleable offerings. */
export async function setOfferingsDisabled(
  memorialId: string,
  disabled: readonly string[],
): Promise<void> {
  await db()
    .update(memorials)
    .set({ offeringsDisabled: normalize(disabled) })
    .where(eq(memorials.id, memorialId));
}

function normalize(list: readonly string[]): ToggleableOffering[] {
  return TOGGLEABLE_OFFERINGS.filter((slug) => list.includes(slug));
}

import { db } from "@/db/client";
import { offeringProducts } from "@/db/schema";
import { OFFERING_CATALOG } from "@/modules/offerings/catalog";

/**
 * Seeds the offering product catalogue.
 *
 * Idempotent: `onConflictDoNothing` on the slug leaves existing rows untouched.
 * The runtime also lazily inserts these on first use, so this seed only exists
 * to give a fresh production database the catalogue up front.
 */
export async function seedOfferings(): Promise<{ offeringProducts: number }> {
  const entries = Object.values(OFFERING_CATALOG);

  const inserted = await db()
    .insert(offeringProducts)
    .values(
      entries.map((entry) => ({
        slug: entry.slug,
        category: entry.category,
        priceMinor: entry.priceMinor,
        currency: entry.currency,
        points: entry.points,
        displayDurationHours: entry.displayDurationHours,
        isActive: true,
      })),
    )
    .onConflictDoNothing({ target: offeringProducts.slug })
    .returning({ id: offeringProducts.id });

  return { offeringProducts: inserted.length };
}

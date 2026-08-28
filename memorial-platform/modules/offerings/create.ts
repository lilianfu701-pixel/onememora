import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { memorialOfferings, offeringProducts } from "@/db/schema";
import type { Result } from "@/lib/result";
import { OFFERING_CATALOG, type OfferingSlug } from "./catalog";
import { maskName } from "./mask";

export type CreateOfferingError = "PRODUCT_NOT_FOUND" | "INVALID_AMOUNT";

export interface CreateOfferingInput {
  memorialId: string;
  slug: OfferingSlug;
  giverUserId?: string | null;
  /** Raw name as entered by the giver, before optional masking. */
  name?: string | null;
  /** Eulogy for a wreath, or a blessing on a donation. */
  message?: string | null;
  /** When true, store a masked form of the name for public display. */
  masked?: boolean;
  /** Required for donations; ignored for fixed-price offerings. */
  amountMinor?: number | null;
  /** The settled order this offering was paid through, when there was one. */
  orderId?: string | null;
}

export interface CreatedOffering {
  id: string;
  slug: OfferingSlug;
  displayName: string | null;
  message: string | null;
  amountMinor: number;
  expiresAt: Date | null;
  createdAt: Date;
}

/**
 * Ensures the catalogue product row exists, returning its id.
 *
 * Idempotent: the first offering of a kind inserts the product; later ones
 * find it. This keeps the altar working before any seed has run, which is what
 * "just click and see it" needs in development.
 */
async function ensureProductId(slug: OfferingSlug): Promise<string> {
  const existing = await db()
    .select({ id: offeringProducts.id })
    .from(offeringProducts)
    .where(eq(offeringProducts.slug, slug))
    .limit(1);

  if (existing[0]) return existing[0].id;

  const entry = OFFERING_CATALOG[slug];
  await db()
    .insert(offeringProducts)
    .values({
      slug: entry.slug,
      category: entry.category,
      priceMinor: entry.priceMinor,
      currency: entry.currency,
      points: entry.points,
      displayDurationHours: entry.displayDurationHours,
      isActive: true,
    })
    .onConflictDoNothing({ target: offeringProducts.slug });

  const created = await db()
    .select({ id: offeringProducts.id })
    .from(offeringProducts)
    .where(eq(offeringProducts.slug, slug))
    .limit(1);

  // The row is guaranteed to exist now — either our insert landed or a
  // concurrent one did and onConflictDoNothing let it pass.
  return created[0]!.id;
}

/**
 * Records an offering left on a memorial.
 *
 * Payment is intentionally out of scope here: the caller has already settled
 * (or, in development, skipped) it. This function is the ledger side — it
 * writes the offering row and computes when it stops showing.
 */
export async function createOffering(
  input: CreateOfferingInput,
): Promise<Result<CreatedOffering, CreateOfferingError>> {
  const entry = OFFERING_CATALOG[input.slug];

  const amountMinor =
    input.slug === "donation"
      ? Math.trunc(input.amountMinor ?? 0)
      : entry.priceMinor;

  if (input.slug === "donation" && amountMinor <= 0) {
    return { ok: false, error: "INVALID_AMOUNT" };
  }

  const productId = await ensureProductId(input.slug);

  const rawName = input.name?.trim() || null;
  const displayName = rawName
    ? input.masked
      ? maskName(rawName)
      : rawName
    : null;
  const message = input.message?.trim() || null;

  const now = new Date();
  const expiresAt =
    entry.displayDurationHours === null
      ? null
      : new Date(now.getTime() + entry.displayDurationHours * 3_600_000);

  const [row] = await db()
    .insert(memorialOfferings)
    .values({
      memorialId: input.memorialId,
      productId,
      giverUserId: input.giverUserId ?? null,
      giverDisplayName: displayName,
      message,
      quantity: 1,
      amountMinor,
      currency: entry.currency,
      pointsAwarded: amountMinor,
      orderId: input.orderId ?? null,
      status: "active",
      expiresAt,
    })
    .returning({
      id: memorialOfferings.id,
      createdAt: memorialOfferings.createdAt,
    });

  return {
    ok: true,
    value: {
      id: row!.id,
      slug: input.slug,
      displayName,
      message,
      amountMinor,
      expiresAt,
      createdAt: row!.createdAt,
    },
  };
}

import { and, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { memorialOfferings, offeringProducts } from "@/db/schema";

export type OfferingSummary = {
  incense: number;
  candle: number;
  wreath: number;
  donation: number;
  donationTotal: number;
  recentCandles: { name: string | null; createdAt: Date }[];
  recentWreaths: {
    name: string | null;
    message: string | null;
    createdAt: Date;
  }[];
  recentDonations: {
    name: string | null;
    amountMinor: number;
    createdAt: Date;
  }[];
};

export async function offeringSummary(
  memorialId: string,
): Promise<OfferingSummary> {
  const now = new Date();

  const rows = await db()
    .select({
      category: offeringProducts.category,
      slug: offeringProducts.slug,
      n: sql<number>`count(*)::int`,
    })
    .from(memorialOfferings)
    .innerJoin(
      offeringProducts,
      eq(memorialOfferings.productId, offeringProducts.id),
    )
    .where(
      and(
        eq(memorialOfferings.memorialId, memorialId),
        eq(memorialOfferings.status, "active"),
        gt(memorialOfferings.expiresAt, now),
      ),
    )
    .groupBy(offeringProducts.category, offeringProducts.slug);

  const countOf = (cat: string): number =>
    rows
      .filter((r) => r.category === cat)
      .reduce((sum, r) => sum + r.n, 0);

  const donationCount = rows
    .filter((r) => r.slug.startsWith("donation"))
    .reduce((sum, r) => sum + r.n, 0);

  const recentCandles = await db()
    .select({
      name: memorialOfferings.giverDisplayName,
      createdAt: memorialOfferings.createdAt,
    })
    .from(memorialOfferings)
    .innerJoin(
      offeringProducts,
      eq(memorialOfferings.productId, offeringProducts.id),
    )
    .where(
      and(
        eq(memorialOfferings.memorialId, memorialId),
        eq(memorialOfferings.status, "active"),
        eq(offeringProducts.category, "candle"),
        gt(memorialOfferings.expiresAt, now),
      ),
    )
    .orderBy(desc(memorialOfferings.createdAt))
    .limit(20);

  const recentWreaths = await db()
    .select({
      name: memorialOfferings.giverDisplayName,
      message: memorialOfferings.message,
      createdAt: memorialOfferings.createdAt,
    })
    .from(memorialOfferings)
    .innerJoin(
      offeringProducts,
      eq(memorialOfferings.productId, offeringProducts.id),
    )
    .where(
      and(
        eq(memorialOfferings.memorialId, memorialId),
        eq(memorialOfferings.status, "active"),
        eq(offeringProducts.category, "wreath"),
        gt(memorialOfferings.expiresAt, now),
      ),
    )
    .orderBy(desc(memorialOfferings.createdAt))
    .limit(10);

  const recentDonations = await db()
    .select({
      name: memorialOfferings.giverDisplayName,
      amountMinor: memorialOfferings.amountMinor,
      createdAt: memorialOfferings.createdAt,
    })
    .from(memorialOfferings)
    .innerJoin(
      offeringProducts,
      eq(memorialOfferings.productId, offeringProducts.id),
    )
    .where(
      and(
        eq(memorialOfferings.memorialId, memorialId),
        eq(memorialOfferings.status, "active"),
        sql`${offeringProducts.slug} LIKE 'donation%'`,
      ),
    )
    .orderBy(desc(memorialOfferings.amountMinor))
    .limit(30);

  const donationTotalRow = await db()
    .select({
      total: sql<number>`coalesce(sum(${memorialOfferings.amountMinor}), 0)::int`,
    })
    .from(memorialOfferings)
    .innerJoin(
      offeringProducts,
      eq(memorialOfferings.productId, offeringProducts.id),
    )
    .where(
      and(
        eq(memorialOfferings.memorialId, memorialId),
        eq(memorialOfferings.status, "active"),
        sql`${offeringProducts.slug} LIKE 'donation%'`,
      ),
    );

  return {
    incense: countOf("incense"),
    candle: countOf("candle"),
    wreath: countOf("wreath"),
    donation: donationCount,
    donationTotal: donationTotalRow[0]?.total ?? 0,
    recentCandles,
    recentWreaths,
    recentDonations: recentDonations.map((d) => ({
      name: d.name,
      amountMinor: Number(d.amountMinor ?? 0),
      createdAt: d.createdAt,
    })),
  };
}

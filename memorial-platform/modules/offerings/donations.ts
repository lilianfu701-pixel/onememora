import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { memorialOfferings, offeringProducts } from "@/db/schema";

export interface DonationRecord {
  id: string;
  name: string | null;
  amountMinor: number;
  message: string | null;
  createdAt: Date;
}

export interface DonationLedger {
  records: DonationRecord[];
  count: number;
  grossMinor: number;
}

/**
 * Every donation left on a memorial, newest first.
 *
 * This is the family's view: unlike the public merit book (which ranks by
 * amount and masks names), the family sees each gift in the order it arrived,
 * with whatever name and message the giver left. Payout accounting lives
 * elsewhere; this is the record of what came in.
 */
export async function listDonations(
  memorialId: string,
): Promise<DonationLedger> {
  const rows = await db()
    .select({
      id: memorialOfferings.id,
      name: memorialOfferings.giverDisplayName,
      amountMinor: memorialOfferings.amountMinor,
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
        sql`${offeringProducts.slug} LIKE 'donation%'`,
      ),
    )
    .orderBy(desc(memorialOfferings.createdAt))
    .limit(500);

  const records: DonationRecord[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    amountMinor: Number(r.amountMinor ?? 0),
    message: r.message,
    createdAt: r.createdAt,
  }));

  const grossMinor = records.reduce((sum, r) => sum + r.amountMinor, 0);

  return { records, count: records.length, grossMinor };
}

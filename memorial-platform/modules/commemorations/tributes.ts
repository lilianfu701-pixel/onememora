import { count, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { memorialTributes } from "@/db/schema";

export type TributeType = "candle" | "flower";
export type TributeCounts = { candle: number; flower: number };

/** How many candles and flowers a memorial has received. */
export async function tributeCounts(
  memorialId: string,
): Promise<TributeCounts> {
  const rows = await db()
    .select({ type: memorialTributes.type, n: count() })
    .from(memorialTributes)
    .where(eq(memorialTributes.memorialId, memorialId))
    .groupBy(memorialTributes.type);

  const of = (type: TributeType): number =>
    Number(rows.find((row) => row.type === type)?.n ?? 0);

  return { candle: of("candle"), flower: of("flower") };
}

/** Records one act of remembrance. */
export async function addTribute(
  memorialId: string,
  type: TributeType,
  actorUserId: string | null,
): Promise<void> {
  await db()
    .insert(memorialTributes)
    .values({ memorialId, type, actorUserId });
}

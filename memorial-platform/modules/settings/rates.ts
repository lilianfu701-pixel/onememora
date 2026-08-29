import { inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { platformSettings } from "@/db/schema";
import { env } from "@/lib/env";

const KEY_COLLECT = "cny_usd_rate_collect";
const KEY_PAYOUT = "cny_usd_rate_payout";

export interface FxRates {
  /** CNY per 1 USD when charging buyers. */
  collect: number;
  /** CNY per 1 USD when gifting the family. */
  payout: number;
}

function parseRate(value: string | undefined, fallback: number): number {
  const n = value === undefined ? NaN : Number(value);
  return Number.isFinite(n) && n >= 1 && n <= 20 ? n : fallback;
}

/**
 * The live FX rates. A stored setting (editable in the admin panel) wins; the
 * env value is the fallback so a fresh deploy still has sane rates.
 */
export async function getRates(): Promise<FxRates> {
  const rows = await db()
    .select({ key: platformSettings.key, value: platformSettings.value })
    .from(platformSettings)
    .where(inArray(platformSettings.key, [KEY_COLLECT, KEY_PAYOUT]));

  const stored = new Map(rows.map((r) => [r.key, r.value]));
  const e = env();
  return {
    collect: parseRate(stored.get(KEY_COLLECT), e.CNY_USD_RATE_COLLECT),
    payout: parseRate(stored.get(KEY_PAYOUT), e.CNY_USD_RATE_PAYOUT),
  };
}

/** The buy-in rate, used to convert an RMB price to a USD charge. */
export async function collectRate(): Promise<number> {
  return (await getRates()).collect;
}

async function upsert(key: string, value: number): Promise<void> {
  await db()
    .insert(platformSettings)
    .values({ key, value: String(value) })
    .onConflictDoUpdate({
      target: platformSettings.key,
      set: { value: String(value), updatedAt: sql`now()` },
    });
}

/** Persist new rates. Values outside [1,20] are rejected by the caller. */
export async function setRates(rates: Partial<FxRates>): Promise<void> {
  if (rates.collect !== undefined) await upsert(KEY_COLLECT, rates.collect);
  if (rates.payout !== undefined) await upsert(KEY_PAYOUT, rates.payout);
}

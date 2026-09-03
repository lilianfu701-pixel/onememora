/**
 * Gregorian dates for the two Chinese remembrance festivals.
 *
 * Qingming (清明) is a solar term (~Apr 4–5); Zhongyuan (中元, the Ghost
 * Festival) is the 15th day of the 7th lunar month. Both are the same day for
 * everyone, so rather than a lunar/solar-term engine we keep a small verified
 * table. A year missing from the table simply does not fire — a fail-safe: a
 * wrong reminder date is worse than none. Extend the table before it runs out.
 */

export type Festival = "qingming" | "zhongyuan";

// "YYYY": "MM-DD"
const QINGMING: Record<string, string> = {
  "2025": "04-04",
  "2026": "04-05",
  "2027": "04-05",
  "2028": "04-04",
  "2029": "04-04",
  "2030": "04-05",
  "2031": "04-05",
  "2032": "04-04",
};

const ZHONGYUAN: Record<string, string> = {
  "2025": "09-06",
  "2026": "08-27",
  "2027": "08-16",
  "2028": "09-03",
  "2029": "08-24",
  "2030": "08-13",
  "2031": "09-01",
  "2032": "08-20",
};

/** The festival's Gregorian date in a given year as "YYYY-MM-DD", or null. */
export function festivalDate(festival: Festival, year: number): string | null {
  const table = festival === "qingming" ? QINGMING : ZHONGYUAN;
  const md = table[String(year)];
  return md ? `${year}-${md}` : null;
}

export const FESTIVALS: readonly Festival[] = ["qingming", "zhongyuan"];

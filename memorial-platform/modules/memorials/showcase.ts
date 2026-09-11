import { and, arrayContains, desc, eq, gte, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { deceasedPeople, memorialNames, memorials } from "@/db/schema";
import { portraitsBySlug } from "@/modules/media/service";

/** How long a newly published memorial stays featured on its channel homepages. */
const SHOWCASE_WINDOW_DAYS = 30;

export type ShowcaseMemorial = {
  slug: string;
  name: string;
  birthYear: number | null;
  deathYear: number | null;
  /** The 遗像, when the family has uploaded one; null renders a monogram. */
  portraitUrl: string | null;
};

function yearOf(date: string | null, precision: string): number | null {
  // A placeholder day (year/unknown precision stores 1948-01-01) is still a real
  // year; only "unknown" carries no year at all.
  if (!date || precision === "unknown") return null;
  const year = Number.parseInt(date.slice(0, 4), 10);
  return Number.isFinite(year) ? year : null;
}

/**
 * The memorials to feature on a channel's homepage: public, published, opted in
 * to homepage display, belonging to this channel, and published within the last
 * month. Newest first — never ranked, so no family's page is raised above
 * another's (doc 01 section 4.3).
 */
export async function recentMemorialsForChannel(
  channel: string,
  limit = 12,
): Promise<ShowcaseMemorial[]> {
  const since = new Date(Date.now() - SHOWCASE_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const rows = await selectRows(channel, since, limit);

  // Portraits in one batch, keyed by slug. A failure here is not fatal: the
  // showcase still lists the names, just with monograms.
  let portraits = new Map<string, string>();
  if (rows.length > 0) {
    try {
      portraits = await portraitsBySlug(rows.map((r) => r.slug));
    } catch {
      portraits = new Map<string, string>();
    }
  }

  return rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    birthYear: yearOf(r.birthDate, r.birthPrecision),
    deathYear: yearOf(r.deathDate, r.deathPrecision),
    // A stable per-request-resolving path, not the signed URL itself: the
    // homepage is cached for an hour but a signed media URL lasts five minutes,
    // so the page must hold something that never goes stale. Null (no portrait)
    // still renders the monogram.
    portraitUrl: portraits.has(r.slug) ? `/api/portrait/${r.slug}` : null,
  }));
}

type ShowcaseRow = {
  slug: string;
  name: string;
  birthDate: string | null;
  birthPrecision: string;
  deathDate: string | null;
  deathPrecision: string;
};

/**
 * Runs the query, returning an empty list rather than throwing. The homepage is
 * statically rendered and edge-cached, so a database hiccup at render time must
 * degrade to a homepage without the showcase, never a homepage that fails.
 */
async function selectRows(
  channel: string,
  since: Date,
  limit: number,
): Promise<ShowcaseRow[]> {
  try {
    return await db()
    .select({
      slug: memorials.slug,
      name: memorialNames.value,
      birthDate: deceasedPeople.birthDate,
      birthPrecision: deceasedPeople.birthDatePrecision,
      deathDate: deceasedPeople.deathDate,
      deathPrecision: deceasedPeople.deathDatePrecision,
    })
    .from(memorials)
    .innerJoin(
      memorialNames,
      and(
        eq(memorialNames.memorialId, memorials.id),
        eq(memorialNames.type, "primary"),
      ),
    )
    .innerJoin(
      deceasedPeople,
      eq(deceasedPeople.id, memorials.deceasedPersonId),
    )
    .where(
      and(
        eq(memorials.visibility, "public"),
        eq(memorials.status, "published"),
        eq(memorials.homepageDisplay, true),
        isNull(memorials.deletionRequestedAt),
        arrayContains(memorials.regions, [channel]),
        gte(memorials.publishedAt, since),
      ),
    )
    .orderBy(desc(memorials.publishedAt), desc(memorials.id))
    .limit(limit);
  } catch {
    return [];
  }
}

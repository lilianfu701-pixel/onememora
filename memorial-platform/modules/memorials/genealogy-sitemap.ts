import { and, asc, count, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { deceasedPeople, memorials } from "@/db/schema";
import { memorialUrl } from "@/modules/memorials/seo";

/**
 * The Chinese genealogy sitemap.
 *
 * Pages imported from family books (家谱/族谱) carry a clan name. They are
 * written in Chinese and searched for in Chinese, so only their `zh-CN`
 * address is listed, in sitemaps of their own: there are far more of them
 * than the main sitemap can hold, and the main sitemap leaves them out.
 *
 * Same filter as the main sitemap: public, published, indexable, not being
 * deleted. A page made private drops out on the next request.
 */
export const GENEALOGY_LOCALE = "zh-CN";

/** Google accepts 50,000 URLs per sitemap; stay well below it. */
export const GENEALOGY_URLS_PER_SITEMAP = 40_000;

const listable = and(
  eq(memorials.visibility, "public"),
  eq(memorials.status, "published"),
  eq(memorials.searchEngineIndexable, true),
  isNull(memorials.deletionRequestedAt),
  isNotNull(deceasedPeople.clanName),
);

export async function countGenealogyPages(): Promise<number> {
  const [row] = await db()
    .select({ n: count() })
    .from(memorials)
    .innerJoin(deceasedPeople, eq(memorials.deceasedPersonId, deceasedPeople.id))
    .where(listable);
  return row?.n ?? 0;
}

export async function genealogyPage(page: number) {
  return db()
    .select({ slug: memorials.slug, publishedAt: memorials.publishedAt })
    .from(memorials)
    .innerJoin(deceasedPeople, eq(memorials.deceasedPersonId, deceasedPeople.id))
    .where(listable)
    .orderBy(asc(memorials.id))
    .limit(GENEALOGY_URLS_PER_SITEMAP)
    .offset(page * GENEALOGY_URLS_PER_SITEMAP);
}

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

export function genealogyIndexXml(base: string, pages: number): string {
  const items = Array.from(
    { length: pages },
    (_, i) => `<sitemap><loc>${escapeXml(`${base}/sitemaps/zh-genealogy-${i}.xml`)}</loc></sitemap>`,
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items.join("\n")}\n</sitemapindex>\n`;
}

export function genealogyUrlsetXml(
  appUrl: string,
  rows: { slug: string; publishedAt: Date | null }[],
): string {
  const items = rows.map((row) => {
    const loc = escapeXml(memorialUrl({ appUrl, locale: GENEALOGY_LOCALE, slug: row.slug }));
    const lastmod = row.publishedAt ? `<lastmod>${row.publishedAt.toISOString()}</lastmod>` : "";
    return `<url><loc>${loc}</loc>${lastmod}<changefreq>monthly</changefreq><priority>0.7</priority></url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items.join("\n")}\n</urlset>\n`;
}

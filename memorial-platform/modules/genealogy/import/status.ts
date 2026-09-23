import { and, isNull, or, like } from "drizzle-orm";
import { db } from "@/db/client";
import { memorials } from "@/db/schema";

/**
 * The external ids that already have a seeded memorial, read straight from the
 * database. The admin panel uses this to show real "已导入 N/总数" state on
 * load — the per-row click state is in memory only and resets on a reload,
 * which made fully-imported families look 待导入.
 *
 * Both source namespaces are covered: Wikidata families key on
 * `import:wikidata:{QID}` and CBDB families on `import:cbdb:{personId}`.
 *
 * The external id can itself contain colons — zh.wikipedia-mined people that
 * never resolved to a QID are keyed `import:wikidata:zhwiki:{name}`, so the id
 * is `zhwiki:{name}`. Taking only the last `:` segment would drop the `zhwiki:`
 * prefix and the count would never match, leaving those families stuck at
 * "部分导入 N/总数" forever. So we add BOTH the full id after the namespace
 * prefix (matches `zhwiki:{name}`) and the last segment (matches bare QIDs,
 * CBDB numeric ids, and any legacy `import:{ns}:{family}:{id}` key).
 */
export async function importedWikidataExternalIds(): Promise<Set<string>> {
  const rows = await db()
    .select({ key: memorials.creationIdempotencyKey })
    .from(memorials)
    .where(
      and(
        or(
          like(memorials.creationIdempotencyKey, "import:wikidata:%"),
          like(memorials.creationIdempotencyKey, "import:cbdb:%"),
          like(memorials.creationIdempotencyKey, "import:lipu-lidailong:%"),
        ),
        isNull(memorials.deletionRequestedAt),
      ),
    );
  const ids = new Set<string>();
  for (const row of rows) {
    const key = row.key;
    if (!key) continue;
    const lastSegment = key.split(":").pop();
    if (lastSegment) ids.add(lastSegment);
    const afterNamespace = key.match(/^import:(?:wikidata|cbdb|lipu-lidailong):(.+)$/);
    if (afterNamespace?.[1]) ids.add(afterNamespace[1]);
  }
  return ids;
}

/**
 * externalId → the most recent `createdAt` (epoch ms) of a seeded page for that
 * id. Lets the admin panel float the family you just imported to the top of the
 * 已导入 group instead of burying it among hundreds by registration order.
 * Same dual-form id extraction as {@link importedWikidataExternalIds}.
 */
export async function importedExternalIdTimes(): Promise<Map<string, number>> {
  const rows = await db()
    .select({
      key: memorials.creationIdempotencyKey,
      createdAt: memorials.createdAt,
    })
    .from(memorials)
    .where(
      and(
        or(
          like(memorials.creationIdempotencyKey, "import:wikidata:%"),
          like(memorials.creationIdempotencyKey, "import:cbdb:%"),
          like(memorials.creationIdempotencyKey, "import:lipu-lidailong:%"),
        ),
        isNull(memorials.deletionRequestedAt),
      ),
    );
  const times = new Map<string, number>();
  const bump = (id: string, t: number) => {
    const prev = times.get(id);
    if (prev === undefined || t > prev) times.set(id, t);
  };
  for (const row of rows) {
    const key = row.key;
    if (!key) continue;
    const t = row.createdAt ? new Date(row.createdAt).getTime() : 0;
    const lastSegment = key.split(":").pop();
    if (lastSegment) bump(lastSegment, t);
    const afterNamespace = key.match(/^import:(?:wikidata|cbdb|lipu-lidailong):(.+)$/);
    if (afterNamespace?.[1]) bump(afterNamespace[1], t);
  }
  return times;
}

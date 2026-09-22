import { z } from "zod";
import { correlationIdFrom, jsonError, jsonSuccess, readJson } from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import { importGenealogy } from "@/modules/genealogy/import/importer";
import { unimportGenealogy } from "@/modules/genealogy/import/unimport";
import { ensureImportStewardActor } from "@/modules/genealogy/import/steward";
import type { GenealogySource } from "@/modules/genealogy/import/types";
import { kongLineageSource } from "@/modules/genealogy/import/sources/kong-lineage";
import { songSuFamilySource } from "@/modules/genealogy/import/sources/song-su-family";
import { wikidataFamilySource } from "@/modules/genealogy/import/sources/wikidata-families";
import {
  zhwikiFamilySource,
  ZHWIKI_CLEANUP_KEY,
} from "@/modules/genealogy/import/sources/zhwiki-families";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Resolves a source key to its loader: the two hand-built lineages (孔子世系,
 * 三苏), every Wikidata family, and every zhwiki-mined family (`zhwiki:` prefix).
 * One family per request keeps a seed inside `maxDuration`; the admin panel
 * imports several by looping.
 */
function resolveSource(key: string): GenealogySource | undefined {
  if (key === "kong") return kongLineageSource;
  if (key === "song") return songSuFamilySource;
  const zhwiki = zhwikiFamilySource(key);
  if (zhwiki) return zhwiki;
  return wikidataFamilySource(key);
}

const schema = z.object({
  source: z.string().min(1),
  /** "seed" plants the batch; "rollback" removes exactly that batch. */
  action: z.enum(["seed", "rollback"]).default("seed"),
  /** Seed only deceased generations — the safe default for a first run. */
  skipLiving: z.boolean().optional(),
});

/**
 * Seeds a 族谱 batch into the platform from the admin panel — so a seed runs in
 * the production runtime (which already has the database) rather than anyone
 * pointing a script at the production database by hand.
 *
 * Super-admins only; returns 404 otherwise, so the endpoint's existence is not
 * disclosed. Idempotent: re-running creates nothing new. The seed runs as a
 * dedicated steward account, not the calling admin.
 */
export async function POST(request: Request): Promise<Response> {
  const correlationId = correlationIdFrom(request);

  const actor = await currentActor();
  if (actor.platformRole !== "super_admin") {
    return jsonError("MEMORIAL_NOT_FOUND", correlationId);
  }

  const body = await readJson(request, schema, correlationId);
  if (!body.ok) {
    return body.response;
  }

  // The junk-cleanup pseudo-family may only be rolled back (to delete the bad
  // pages), never imported — importing it would re-create the junk.
  if (body.value.source === ZHWIKI_CLEANUP_KEY && body.value.action !== "rollback") {
    return jsonError("MEMORIAL_NOT_FOUND", correlationId);
  }

  const source = resolveSource(body.value.source);
  if (!source) {
    return jsonError("MEMORIAL_NOT_FOUND", correlationId);
  }
  const dataset = await source.load();

  if (body.value.action === "rollback") {
    const report = await unimportGenealogy(dataset);
    return jsonSuccess(report, correlationId, 200);
  }

  const steward = await ensureImportStewardActor();
  const report = await importGenealogy(steward, dataset, {
    correlationId,
    ...(body.value.skipLiving !== undefined
      ? { skipLiving: body.value.skipLiving }
      : {}),
  });

  return jsonSuccess(report, correlationId, 200);
}

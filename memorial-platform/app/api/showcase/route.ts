import { normalizeLocale } from "@/lib/locale";
import { recentMemorialsForChannel } from "@/modules/memorials/showcase";

export const dynamic = "force-dynamic";

/**
 * The "最新追思" list for a channel, fetched by the homepage after it loads.
 *
 * The homepage HTML is edge-cached for speed (China), but this list changes
 * whenever a memorial is published — baking it into that long-lived cache left
 * new pages invisible until the cache expired. Serving it from here instead
 * keeps the cached homepage fast while the list stays fresh: a short cache
 * (minutes) is enough to be quick without hiding a just-published memorial.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const channel = normalizeLocale(url.searchParams.get("locale") ?? "en");

  let memorials: Awaited<ReturnType<typeof recentMemorialsForChannel>> = [];
  try {
    memorials = await recentMemorialsForChannel(channel);
  } catch {
    memorials = [];
  }

  return new Response(JSON.stringify({ memorials }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      // Fresh within a few minutes, but cacheable enough to stay quick.
      "cache-control": "public, max-age=60, s-maxage=300",
    },
  });
}

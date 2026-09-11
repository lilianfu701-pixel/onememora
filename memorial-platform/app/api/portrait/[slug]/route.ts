import { publicPortraitBytesForSlug } from "@/modules/media/service";

export const dynamic = "force-dynamic";

/**
 * A stable address for a public memorial's 遗像 — used by the homepage showcase,
 * the social-share cards (og:image / Twitter) and the Person JSON-LD.
 *
 * The underlying media read URL is signed and expires in five minutes, so it
 * cannot be embedded in an hour-cached page or handed to a crawler that fetches
 * it later. This route serves the image bytes directly at a permanent path
 * instead, so the picture always loads — for a browser, a search engine or a
 * social card alike. Public+published only, so a guessed slug can't pull a
 * private page's photo.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await context.params;

  if (!slug || slug.length > 128) {
    return new Response(null, { status: 404 });
  }

  let portrait: { bytes: Uint8Array; contentType: string } | null = null;
  try {
    portrait = await publicPortraitBytesForSlug(slug);
  } catch {
    portrait = null;
  }

  if (!portrait) {
    return new Response(null, { status: 404 });
  }

  return new Response(new Uint8Array(portrait.bytes), {
    status: 200,
    headers: {
      "content-type": portrait.contentType,
      // Cacheable at the edge and by crawlers; a re-uploaded portrait is at most
      // an hour stale, which is fine for a memorial photo.
      "cache-control": "public, max-age=3600",
    },
  });
}

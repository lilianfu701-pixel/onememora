import { publicPortraitUrlForSlug } from "@/modules/media/service";

export const dynamic = "force-dynamic";

/**
 * A stable address for a public memorial's 遗像, used by the homepage showcase.
 *
 * The homepage is edge-cached for an hour, but a media read URL is signed and
 * expires in five minutes — so embedding the signed URL directly leaves the
 * cached page pointing at a dead link minutes later. This route gives the page a
 * stable path instead and redirects to a freshly-resolved URL on every request,
 * so the image always loads however long the page has been cached.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await context.params;

  if (!slug || slug.length > 128) {
    return new Response(null, { status: 404 });
  }

  let url: string | null = null;
  try {
    url = await publicPortraitUrlForSlug(slug);
  } catch {
    url = null;
  }

  if (!url) {
    return new Response(null, { status: 404 });
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: url,
      // Re-resolve well before the underlying signed URL (5 min) expires, so a
      // cached redirect never hands back an address that has already died.
      "Cache-Control": "public, max-age=120",
    },
  });
}

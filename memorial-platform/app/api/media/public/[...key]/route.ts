import { readPublicObject } from "@/modules/media/service";

/**
 * Permanent public URL for a memorial image, without making the storage bucket
 * public.
 *
 * The bucket stays private; this route streams only an object that
 * `readPublicObject` confirms is `ready` and belongs to a `public`, `published`
 * memorial. A quarantine key, a deleted asset, or anything on an unlisted or
 * invite-only memorial answers 404 — the same body a missing object would, so a
 * key's existence is never confirmed.
 *
 * `S3_PUBLIC_BASE_URL` is set to `<origin>/api/media/public`, so the media layer
 * hands out `<origin>/api/media/public/memorials/<id>/ready/<asset>/original.jpg`
 * for public memorials, and short-lived signed URLs for everything else. The URL
 * ends in the asset's extension and carries a per-asset UUID, so it is safe to
 * cache immutably at the edge.
 */
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ key: string[] }> },
): Promise<Response> {
  const { key } = await context.params;
  const objectKey = key.map((part) => decodeURIComponent(part)).join("/");

  // A ready object only ever lives under a `/ready/` prefix. Reject the rest
  // early; the authoritative check is the ready-asset lookup below.
  if (!objectKey.includes("/ready/")) {
    return new Response(null, { status: 404 });
  }

  const object = await readPublicObject(objectKey);
  if (!object) {
    return new Response(null, { status: 404 });
  }

  return new Response(object.bytes as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": object.contentType,
      "Content-Length": String(object.bytes.byteLength),
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
    },
  });
}

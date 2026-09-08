import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/** A channel label: lowercase letters, digits, dash or underscore. */
const CHANNEL_RE = /^[a-z0-9_-]{1,32}$/;

/**
 * Same-site path only, so `?to=` can never become an open redirect to another
 * host. Must start with a single "/" and carry no scheme or backslash.
 */
function safeDestPath(to: string | null): string {
  if (!to) return "/zh-CN";
  if (!to.startsWith("/") || to.startsWith("//") || to.includes("\\")) {
    return "/zh-CN";
  }
  return to;
}

/**
 * Marketing channel short links.
 *
 * `/go/<channel>` redirects to a landing page (the Chinese home by default, or
 * `?to=/zh-CN/memorials/memorial-XXXX` for a specific page) and tags the
 * destination with UTM parameters. The `/go/<channel>` request itself is logged
 * by Cloudflare's traffic analytics under Paths, so each channel's clicks are
 * countable there even though the free Web Analytics does not break down by UTM.
 *
 * The redirect is 307 (temporary) on purpose: a permanent one would be cached by
 * the browser, and later clicks would skip the server — losing the count.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channel: string }> },
): Promise<NextResponse> {
  const { channel } = await params;
  const url = new URL(request.url);
  const dest = new URL(safeDestPath(url.searchParams.get("to")), url.origin);

  if (CHANNEL_RE.test(channel)) {
    dest.searchParams.set("utm_source", channel);
    dest.searchParams.set("utm_medium", "shortlink");
    dest.searchParams.set("utm_campaign", "launch");
  }

  return NextResponse.redirect(dest, 307);
}

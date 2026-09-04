import { NextResponse } from "next/server";
import { currentActor } from "@/modules/auth/current-user";
import { unreadInboxCount } from "@/modules/messaging/inbox";

// Per-request session lookup for the client nav. Kept out of the page render so
// the surrounding HTML stays cacheable; this endpoint itself is never cached.
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const actor = await currentActor();
  const unread = actor.userId ? await unreadInboxCount(actor.userId) : 0;
  return NextResponse.json(
    { signedIn: Boolean(actor.userId), unread },
    { headers: { "Cache-Control": "no-store" } },
  );
}

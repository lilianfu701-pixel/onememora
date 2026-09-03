import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { verifyUnsubscribe } from "@/modules/reminders/unsubscribe";

export const dynamic = "force-dynamic";

/** One-click unsubscribe from reminder emails — no login, token-authenticated. */
export async function GET(request: Request): Promise<Response> {
  const token = new URL(request.url).searchParams.get("t") ?? "";
  const userId = verifyUnsubscribe(token);

  if (userId) {
    await db()
      .update(users)
      .set({ emailRemindersEnabled: false })
      .where(eq(users.id, userId));
  }

  const message = userId
    ? "你已退订提醒邮件，将不再收到祭日与节日提醒。<br>You have unsubscribed from reminder emails."
    : "链接无效或已过期。<br>This link is invalid or has expired.";

  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:-apple-system,sans-serif;background:#fbf6eb;color:#253027;padding:60px 24px;text-align:center"><p style="font-size:16px;line-height:1.7;max-width:420px;margin:0 auto">${message}</p></body></html>`,
    {
      status: userId ? 200 : 400,
      headers: { "content-type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    },
  );
}

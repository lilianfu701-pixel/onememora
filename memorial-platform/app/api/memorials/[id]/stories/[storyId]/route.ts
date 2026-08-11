import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { visitorSubmissions } from "@/db/schema";
import { correlationIdFrom, jsonError, jsonSuccess } from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import { memorialRoleFor } from "@/modules/memorials/membership";
import { canOnMemorial } from "@/modules/permissions/policy";

export const dynamic = "force-dynamic";

/**
 * The memorial owner hides a guestbook message. It is not deleted — a hidden
 * row stays for the family's record — only removed from the public page.
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; storyId: string }> },
): Promise<Response> {
  const correlationId = correlationIdFrom(request);
  const { id, storyId } = await context.params;

  if (!z.uuid().safeParse(id).success || !z.uuid().safeParse(storyId).success) {
    return jsonError("MEMORIAL_NOT_FOUND", correlationId);
  }

  const actor = await currentActor();
  if (!actor.userId) {
    return jsonError("AUTH_REQUIRED", correlationId);
  }

  const role = await memorialRoleFor(id, actor.userId);
  if (!role) {
    return jsonError("MEMORIAL_NOT_FOUND", correlationId);
  }

  if (!canOnMemorial({ actor, role, action: "publish_content" })) {
    return jsonError("MEMORIAL_FORBIDDEN", correlationId);
  }

  await db()
    .update(visitorSubmissions)
    .set({ status: "hidden" })
    .where(
      and(
        eq(visitorSubmissions.id, storyId),
        eq(visitorSubmissions.memorialId, id),
      ),
    );

  return jsonSuccess({ hidden: true }, correlationId);
}

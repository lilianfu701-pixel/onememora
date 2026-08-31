import { z } from "zod";
import { correlationIdFrom, jsonError, jsonSuccess } from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import { blockMessageAuthor } from "@/modules/memorials/blocking";
import { memorialRoleFor } from "@/modules/memorials/membership";
import { canOnMemorial } from "@/modules/permissions/policy";

export const dynamic = "force-dynamic";

/**
 * A memorial manager blocks the author of a guestbook message: the person can
 * no longer leave messages or replies here, and everything they have written is
 * hidden. Anonymous messages have no account to block — the family deletes those
 * instead.
 */
export async function POST(
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

  const result = await blockMessageAuthor({
    memorialId: id,
    storyId,
    byUserId: actor.userId,
  });

  if (!result.ok) {
    // The message was anonymous — there is no account to block.
    return jsonError("INVALID_INPUT", correlationId, {
      storyId: ["no_author"],
    });
  }

  return jsonSuccess({ blocked: true }, correlationId);
}

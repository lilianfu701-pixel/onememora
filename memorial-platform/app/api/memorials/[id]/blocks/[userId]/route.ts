import { z } from "zod";
import { correlationIdFrom, jsonError, jsonSuccess } from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import { unblockUser } from "@/modules/memorials/blocking";
import { memorialRoleFor } from "@/modules/memorials/membership";
import { canOnMemorial } from "@/modules/permissions/policy";

export const dynamic = "force-dynamic";

/** A memorial manager lifts a block on a person. */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; userId: string }> },
): Promise<Response> {
  const correlationId = correlationIdFrom(request);
  const { id, userId } = await context.params;

  if (!z.uuid().safeParse(id).success || !z.uuid().safeParse(userId).success) {
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

  await unblockUser(id, userId);
  return jsonSuccess({ lifted: true }, correlationId);
}

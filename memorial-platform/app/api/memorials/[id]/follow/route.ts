import { z } from "zod";
import { correlationIdFrom, jsonError, jsonSuccess } from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import { followMemorial, unfollowMemorial } from "@/modules/reminders/follow";

export const dynamic = "force-dynamic";

async function actorAndId(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<
  | { ok: true; correlationId: string; id: string; userId: string }
  | { ok: false; response: Response }
> {
  const correlationId = correlationIdFrom(request);
  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success) {
    return { ok: false, response: jsonError("MEMORIAL_NOT_FOUND", correlationId) };
  }
  const actor = await currentActor();
  if (!actor.userId) {
    return { ok: false, response: jsonError("AUTH_REQUIRED", correlationId) };
  }
  return { ok: true, correlationId, id, userId: actor.userId };
}

/** Follow a memorial (opt in to its reminder emails). */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const a = await actorAndId(request, context);
  if (!a.ok) return a.response;
  await followMemorial(a.id, a.userId);
  return jsonSuccess({ following: true }, a.correlationId, 200);
}

/** Unfollow a memorial. */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const a = await actorAndId(request, context);
  if (!a.ok) return a.response;
  await unfollowMemorial(a.id, a.userId);
  return jsonSuccess({ following: false }, a.correlationId, 200);
}

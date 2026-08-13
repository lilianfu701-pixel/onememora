import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { memorialBookmarks } from "@/db/schema";
import { correlationIdFrom, jsonError, jsonSuccess } from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";

export const dynamic = "force-dynamic";

/** Adds this memorial to the signed-in person's bookmarks (idempotent). */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const correlationId = correlationIdFrom(request);
  const { id } = await context.params;

  if (!z.uuid().safeParse(id).success) {
    return jsonError("MEMORIAL_NOT_FOUND", correlationId);
  }

  const actor = await currentActor();
  if (!actor.userId) {
    return jsonError("AUTH_REQUIRED", correlationId);
  }

  await db()
    .insert(memorialBookmarks)
    .values({ userId: actor.userId, memorialId: id })
    .onConflictDoNothing();

  return jsonSuccess({ bookmarked: true }, correlationId);
}

/** Removes this memorial from the signed-in person's bookmarks. */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const correlationId = correlationIdFrom(request);
  const { id } = await context.params;

  if (!z.uuid().safeParse(id).success) {
    return jsonError("MEMORIAL_NOT_FOUND", correlationId);
  }

  const actor = await currentActor();
  if (!actor.userId) {
    return jsonError("AUTH_REQUIRED", correlationId);
  }

  await db()
    .delete(memorialBookmarks)
    .where(
      and(
        eq(memorialBookmarks.userId, actor.userId),
        eq(memorialBookmarks.memorialId, id),
      ),
    );

  return jsonSuccess({ bookmarked: false }, correlationId);
}

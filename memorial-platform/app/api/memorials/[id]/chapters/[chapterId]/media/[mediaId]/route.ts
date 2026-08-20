import { z } from "zod";
import { correlationIdFrom, jsonError, jsonSuccess } from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import { detachChapterMedia } from "@/modules/memorials/life-chapters";
import { refuseChapterError } from "@/modules/memorials/chapter-http";

export const dynamic = "force-dynamic";

/** Removes a photo from a chapter (and deletes the underlying asset). */
export async function DELETE(
  request: Request,
  context: {
    params: Promise<{ id: string; chapterId: string; mediaId: string }>;
  },
): Promise<Response> {
  const correlationId = correlationIdFrom(request);
  const { id, chapterId, mediaId } = await context.params;

  if (
    !z.uuid().safeParse(id).success ||
    !z.uuid().safeParse(chapterId).success ||
    !z.uuid().safeParse(mediaId).success
  ) {
    return jsonError("MEMORIAL_NOT_FOUND", correlationId);
  }

  const actor = await currentActor();
  const result = await detachChapterMedia(
    actor,
    chapterId,
    mediaId,
    correlationId,
  );

  if (!result.ok) {
    return refuseChapterError(result.error, correlationId);
  }

  return jsonSuccess({ detached: true }, correlationId);
}

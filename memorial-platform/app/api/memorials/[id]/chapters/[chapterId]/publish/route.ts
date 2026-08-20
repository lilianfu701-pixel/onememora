import { z } from "zod";
import { correlationIdFrom, jsonError, jsonSuccess } from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import { publishChapter } from "@/modules/memorials/life-chapters";
import { refuseChapterError } from "@/modules/memorials/chapter-http";

export const dynamic = "force-dynamic";

/** Publishes a chapter's latest saved version. */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; chapterId: string }> },
): Promise<Response> {
  const correlationId = correlationIdFrom(request);
  const { id, chapterId } = await context.params;

  if (!z.uuid().safeParse(id).success || !z.uuid().safeParse(chapterId).success) {
    return jsonError("MEMORIAL_NOT_FOUND", correlationId);
  }

  const actor = await currentActor();
  const result = await publishChapter(actor, chapterId, correlationId);

  if (!result.ok) {
    return refuseChapterError(result.error, correlationId);
  }

  return jsonSuccess(
    { publishedVersion: result.value.publishedVersion },
    correlationId,
  );
}

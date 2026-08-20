import { z } from "zod";
import {
  correlationIdFrom,
  jsonError,
  jsonSuccess,
  readJson,
} from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import { attachChapterMedia } from "@/modules/memorials/life-chapters";
import { refuseChapterError } from "@/modules/memorials/chapter-http";

export const dynamic = "force-dynamic";

const schema = z.object({
  mediaId: z.uuid(),
});

/** Attaches an already-uploaded photo to a chapter. */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; chapterId: string }> },
): Promise<Response> {
  const correlationId = correlationIdFrom(request);
  const { id, chapterId } = await context.params;

  if (!z.uuid().safeParse(id).success || !z.uuid().safeParse(chapterId).success) {
    return jsonError("MEMORIAL_NOT_FOUND", correlationId);
  }

  const parsed = await readJson(request, schema, correlationId);
  if (!parsed.ok) return parsed.response;

  const actor = await currentActor();
  const result = await attachChapterMedia(
    actor,
    chapterId,
    parsed.value.mediaId,
    correlationId,
  );

  if (!result.ok) {
    return refuseChapterError(result.error, correlationId);
  }

  return jsonSuccess({ attached: true }, correlationId, 201);
}

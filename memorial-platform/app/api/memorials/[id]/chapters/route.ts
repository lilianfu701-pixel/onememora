import { z } from "zod";
import {
  correlationIdFrom,
  jsonError,
  jsonSuccess,
  readJson,
} from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import { addChapter } from "@/modules/memorials/life-chapters";
import { refuseChapterError } from "@/modules/memorials/chapter-http";

export const dynamic = "force-dynamic";

const schema = z.object({
  chapterKey: z.string().trim().min(1).max(40),
});

/** Adds an empty chapter of a chosen kind to the life story. */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const correlationId = correlationIdFrom(request);
  const { id } = await context.params;

  if (!z.uuid().safeParse(id).success) {
    return jsonError("MEMORIAL_NOT_FOUND", correlationId);
  }

  const body = await readJson(request, schema, correlationId);
  if (!body.ok) return body.response;

  const actor = await currentActor();
  const result = await addChapter(
    actor,
    id,
    body.value.chapterKey,
    correlationId,
  );

  if (!result.ok) {
    return refuseChapterError(result.error, correlationId);
  }

  return jsonSuccess({ chapterId: result.value.chapterId }, correlationId, 201);
}

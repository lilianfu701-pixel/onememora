import { z } from "zod";
import {
  correlationIdFrom,
  jsonError,
  jsonSuccess,
  readJson,
} from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import { removeChapter, saveChapter } from "@/modules/memorials/life-chapters";
import { refuseChapterError } from "@/modules/memorials/chapter-http";

export const dynamic = "force-dynamic";

const saveSchema = z.object({
  body: z.string().max(20000),
  sourceLocale: z.string().min(2).max(10).default("en"),
  customTitle: z.string().trim().max(80).nullable().optional(),
});

/** Saves an edit to a chapter (appends a version). */
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string; chapterId: string }> },
): Promise<Response> {
  const correlationId = correlationIdFrom(request);
  const { id, chapterId } = await context.params;

  if (!z.uuid().safeParse(id).success || !z.uuid().safeParse(chapterId).success) {
    return jsonError("MEMORIAL_NOT_FOUND", correlationId);
  }

  const parsed = await readJson(request, saveSchema, correlationId);
  if (!parsed.ok) return parsed.response;

  const actor = await currentActor();
  const result = await saveChapter(
    actor,
    chapterId,
    {
      body: parsed.value.body,
      sourceLocale: parsed.value.sourceLocale,
      ...(parsed.value.customTitle !== undefined
        ? { customTitle: parsed.value.customTitle }
        : {}),
    },
    correlationId,
  );

  if (!result.ok) {
    return refuseChapterError(result.error, correlationId);
  }

  return jsonSuccess({ version: result.value.version }, correlationId);
}

/** Removes a chapter (soft delete). */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; chapterId: string }> },
): Promise<Response> {
  const correlationId = correlationIdFrom(request);
  const { id, chapterId } = await context.params;

  if (!z.uuid().safeParse(id).success || !z.uuid().safeParse(chapterId).success) {
    return jsonError("MEMORIAL_NOT_FOUND", correlationId);
  }

  const actor = await currentActor();
  const result = await removeChapter(actor, chapterId, correlationId);

  if (!result.ok) {
    return refuseChapterError(result.error, correlationId);
  }

  return jsonSuccess({ removed: true }, correlationId);
}

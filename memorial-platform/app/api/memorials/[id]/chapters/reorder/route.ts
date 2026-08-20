import { z } from "zod";
import {
  correlationIdFrom,
  jsonError,
  jsonSuccess,
  readJson,
} from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import { reorderChapters } from "@/modules/memorials/life-chapters";
import { refuseChapterError } from "@/modules/memorials/chapter-http";

export const dynamic = "force-dynamic";

const schema = z.object({
  orderedIds: z.array(z.uuid()).max(50),
});

/** Reorders a memorial's chapters. */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const correlationId = correlationIdFrom(request);
  const { id } = await context.params;

  if (!z.uuid().safeParse(id).success) {
    return jsonError("MEMORIAL_NOT_FOUND", correlationId);
  }

  const parsed = await readJson(request, schema, correlationId);
  if (!parsed.ok) return parsed.response;

  const actor = await currentActor();
  const result = await reorderChapters(
    actor,
    id,
    parsed.value.orderedIds,
    correlationId,
  );

  if (!result.ok) {
    return refuseChapterError(result.error, correlationId);
  }

  return jsonSuccess({ count: result.value.count }, correlationId);
}

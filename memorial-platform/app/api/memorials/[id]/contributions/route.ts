import { z } from "zod";
import {
  correlationIdFrom,
  jsonError,
  jsonSuccess,
  jsonUnprocessable,
  readJson,
  requestIpHash,
} from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import { submitContribution } from "@/modules/memorials/contributions";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().max(60).optional(),
  relation: z.string().trim().max(40).optional(),
  body: z.string().trim().min(1).max(4000),
  sourceLocale: z.string().min(2).max(10).default("en"),
  chapterId: z.uuid().nullable().optional(),
});

/**
 * A friend or family member contributes a remembrance.
 *
 * Held for the family's review — it does not appear on the page until approved.
 * Open to guests for text (rate-limited by IP); a signed-in contributor is
 * named by their account.
 */
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
  const result = await submitContribution(
    actor,
    id,
    {
      body: body.value.body,
      sourceLocale: body.value.sourceLocale,
      ...(body.value.name !== undefined ? { name: body.value.name } : {}),
      ...(body.value.relation !== undefined
        ? { relation: body.value.relation }
        : {}),
      ...(body.value.chapterId !== undefined
        ? { chapterId: body.value.chapterId }
        : {}),
    },
    { requestIpHash: requestIpHash(request) ?? null },
    correlationId,
  );

  if (!result.ok) {
    switch (result.error) {
      case "MEMORIAL_NOT_FOUND":
        return jsonError("MEMORIAL_NOT_FOUND", correlationId);
      case "RATE_LIMITED":
        return jsonError("RATE_LIMITED", correlationId);
      case "EMPTY_BODY":
        return jsonUnprocessable(correlationId, {
          body: ["Please write something first."],
        });
      case "INVALID_CHAPTER":
        return jsonUnprocessable(correlationId, {
          chapterId: ["Unknown chapter."],
        });
    }
  }

  return jsonSuccess(
    { submissionId: result.value.submissionId },
    correlationId,
    201,
  );
}

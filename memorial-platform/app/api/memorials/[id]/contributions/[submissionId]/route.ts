import { z } from "zod";
import {
  correlationIdFrom,
  jsonError,
  jsonSuccess,
  jsonUnprocessable,
  readJson,
} from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import { moderateSubmission } from "@/modules/memorials/content-service";

export const dynamic = "force-dynamic";

const schema = z.object({
  decision: z.enum(["published", "rejected"]),
  note: z.string().trim().max(500).optional(),
});

/** The family approves or declines a pending contribution. */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; submissionId: string }> },
): Promise<Response> {
  const correlationId = correlationIdFrom(request);
  const { id, submissionId } = await context.params;

  if (
    !z.uuid().safeParse(id).success ||
    !z.uuid().safeParse(submissionId).success
  ) {
    return jsonError("MEMORIAL_NOT_FOUND", correlationId);
  }

  const body = await readJson(request, schema, correlationId);
  if (!body.ok) return body.response;

  const actor = await currentActor();
  const result = await moderateSubmission(
    actor,
    submissionId,
    body.value.decision,
    correlationId,
    body.value.note,
  );

  if (!result.ok) {
    switch (result.error) {
      case "AUTH_REQUIRED":
        return jsonError("AUTH_REQUIRED", correlationId);
      case "MEMORIAL_FORBIDDEN":
        return jsonError("MEMORIAL_FORBIDDEN", correlationId);
      case "MEMORIAL_NOT_FOUND":
      case "SUBMISSION_NOT_FOUND":
        return jsonError("MEMORIAL_NOT_FOUND", correlationId);
      case "ALREADY_MODERATED":
        return jsonUnprocessable(correlationId, {
          _: ["This contribution has already been reviewed."],
        });
    }
  }

  return jsonSuccess({ status: result.value.status }, correlationId);
}

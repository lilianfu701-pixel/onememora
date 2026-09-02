import { z } from "zod";
import {
  correlationIdFrom,
  jsonError,
  jsonSuccess,
  jsonUnprocessable,
  readJson,
} from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import {
  escalateTakeover,
  respondToTakeover,
} from "@/modules/memorials/ownership";

export const dynamic = "force-dynamic";

const schema = z.object({
  action: z.enum(["accept", "decline", "escalate"]),
});

/** Owner answers (accept/decline) a takeover, or the requester escalates it. */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; requestId: string }> },
): Promise<Response> {
  const correlationId = correlationIdFrom(request);
  const { requestId } = await context.params;
  if (!z.uuid().safeParse(requestId).success) {
    return jsonError("MEMORIAL_NOT_FOUND", correlationId);
  }

  const body = await readJson(request, schema, correlationId);
  if (!body.ok) return body.response;

  const actor = await currentActor();
  const result =
    body.value.action === "escalate"
      ? await escalateTakeover(actor, requestId, correlationId)
      : await respondToTakeover(
          actor,
          requestId,
          body.value.action,
          correlationId,
        );

  if (!result.ok) {
    if (result.error === "AUTH_REQUIRED") {
      return jsonError("AUTH_REQUIRED", correlationId);
    }
    if (
      result.error === "MEMORIAL_NOT_FOUND" ||
      result.error === "REQUEST_NOT_FOUND"
    ) {
      return jsonError("MEMORIAL_NOT_FOUND", correlationId);
    }
    if (result.error === "NOT_OWNER" || result.error === "NOT_REQUESTER") {
      return jsonError("MEMORIAL_FORBIDDEN", correlationId);
    }
    return jsonUnprocessable(correlationId, { reason: [result.error] });
  }
  return jsonSuccess(result.value, correlationId, 200);
}

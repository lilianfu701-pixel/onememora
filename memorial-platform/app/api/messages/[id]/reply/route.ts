import { z } from "zod";
import {
  correlationIdFrom,
  jsonError,
  jsonSuccess,
  jsonUnprocessable,
  readJson,
} from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import { replyToMessage } from "@/modules/messaging/inbox";

export const dynamic = "force-dynamic";

const schema = z.object({
  body: z.string().trim().min(1).max(2000),
});

/** Replies to a message in the caller's inbox — a new message to its sender. */
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
  const result = await replyToMessage(actor, id, body.value.body, correlationId);

  if (!result.ok) {
    switch (result.error) {
      case "AUTH_REQUIRED":
        return jsonError("AUTH_REQUIRED", correlationId);
      case "RATE_LIMITED":
        return jsonError("RATE_LIMITED", correlationId);
      case "NOT_FOUND":
      case "NO_RECIPIENT":
        return jsonError("MEMORIAL_NOT_FOUND", correlationId);
      default:
        return jsonUnprocessable(correlationId, {
          body: ["Please write a reply first."],
        });
    }
  }

  return jsonSuccess({ sent: true }, correlationId, 201);
}

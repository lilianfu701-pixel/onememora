import { z } from "zod";
import {
  correlationIdFrom,
  jsonError,
  jsonSuccess,
  jsonUnprocessable,
  readJson,
} from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import { contactPlatformAdmins } from "@/modules/messaging/inbox";

export const dynamic = "force-dynamic";

const schema = z.object({
  body: z.string().trim().min(1).max(2000),
});

/**
 * A signed-in user writes to the platform team. The message lands in the
 * admins' inboxes; a reply routes back through the inbox, so no email or
 * contact details are exchanged.
 */
export async function POST(request: Request): Promise<Response> {
  const correlationId = correlationIdFrom(request);

  const body = await readJson(request, schema, correlationId);
  if (!body.ok) return body.response;

  const actor = await currentActor();
  const result = await contactPlatformAdmins(
    actor,
    body.value.body,
    correlationId,
  );

  if (!result.ok) {
    switch (result.error) {
      case "AUTH_REQUIRED":
        return jsonError("AUTH_REQUIRED", correlationId);
      case "RATE_LIMITED":
        return jsonError("RATE_LIMITED", correlationId);
      default:
        return jsonUnprocessable(correlationId, {
          body: ["Please write a message first."],
        });
    }
  }

  return jsonSuccess({ sent: true }, correlationId, 201);
}

import { z } from "zod";
import {
  correlationIdFrom,
  jsonError,
  jsonSuccess,
  readJson,
} from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import { markInboxRead } from "@/modules/messaging/inbox";

export const dynamic = "force-dynamic";

const schema = z.object({
  ids: z.array(z.uuid()).min(1).max(200),
});

/** Marks messages in the caller's own inbox as read. */
export async function POST(request: Request): Promise<Response> {
  const correlationId = correlationIdFrom(request);
  const actor = await currentActor();
  if (!actor.userId) return jsonError("AUTH_REQUIRED", correlationId);

  const body = await readJson(request, schema, correlationId);
  if (!body.ok) return body.response;

  await markInboxRead(actor.userId, body.value.ids);
  return jsonSuccess({ read: true }, correlationId);
}

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
import { sendContactMessage } from "@/modules/memorials/contact";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().max(80).optional(),
  contact: z.string().trim().max(120).optional(),
  body: z.string().trim().min(1).max(2000),
});

/** A visitor sends a private message to the family who manages this memorial. */
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
  const result = await sendContactMessage(
    actor,
    id,
    {
      body: body.value.body,
      ...(body.value.name !== undefined ? { name: body.value.name } : {}),
      ...(body.value.contact !== undefined
        ? { contact: body.value.contact }
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
          body: ["Please write a message first."],
        });
      default:
        return jsonError("MEMORIAL_FORBIDDEN", correlationId);
    }
  }

  return jsonSuccess({ sent: true }, correlationId, 201);
}

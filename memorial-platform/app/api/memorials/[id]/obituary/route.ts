import { z } from "zod";
import {
  correlationIdFrom,
  jsonError,
  jsonSuccess,
  readJson,
} from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import { setObituary } from "@/modules/memorials/obituary";

export const dynamic = "force-dynamic";

const schema = z.object({
  body: z.string().trim().max(4000).optional(),
  nativePlace: z.string().trim().max(120).optional(),
  service: z.string().trim().max(600).optional(),
  survivors: z.string().trim().max(400).optional(),
  publish: z.boolean().optional(),
});

/** Owner/editor writes / publishes the memorial's obituary (讣告). */
export async function PUT(
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
  const result = await setObituary(actor, id, {
    body: body.value.body ?? null,
    nativePlace: body.value.nativePlace ?? null,
    service: body.value.service ?? null,
    survivors: body.value.survivors ?? null,
    publish: body.value.publish ?? false,
  });
  if (!result.ok) {
    if (result.error === "AUTH_REQUIRED") {
      return jsonError("AUTH_REQUIRED", correlationId);
    }
    return jsonError("MEMORIAL_NOT_FOUND", correlationId);
  }
  return jsonSuccess(result.value, correlationId, 200);
}

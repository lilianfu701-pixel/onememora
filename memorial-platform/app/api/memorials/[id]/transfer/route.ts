import { z } from "zod";
import {
  correlationIdFrom,
  jsonError,
  jsonSuccess,
  jsonUnprocessable,
  readJson,
} from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import { transferOwnership } from "@/modules/memorials/ownership";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().trim().email().max(320),
});

/** The current owner hands management to another registered account. */
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
  const result = await transferOwnership(
    actor,
    id,
    body.value.email,
    correlationId,
  );
  if (!result.ok) {
    if (result.error === "AUTH_REQUIRED") {
      return jsonError("AUTH_REQUIRED", correlationId);
    }
    if (result.error === "MEMORIAL_NOT_FOUND") {
      return jsonError("MEMORIAL_NOT_FOUND", correlationId);
    }
    if (result.error === "NOT_OWNER") {
      return jsonError("MEMORIAL_FORBIDDEN", correlationId);
    }
    return jsonUnprocessable(correlationId, { reason: [result.error] });
  }
  return jsonSuccess(result.value, correlationId, 200);
}

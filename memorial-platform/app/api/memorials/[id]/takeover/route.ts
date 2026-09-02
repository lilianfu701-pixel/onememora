import { z } from "zod";
import {
  correlationIdFrom,
  jsonError,
  jsonSuccess,
  jsonUnprocessable,
  readJson,
} from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import { requestTakeover } from "@/modules/memorials/ownership";

export const dynamic = "force-dynamic";

const schema = z.object({
  relationship: z.enum(["spouse", "parent", "child", "sibling"]),
  reason: z.string().trim().min(1).max(2000),
});

/** A registered non-owner requests to take over an unreachable admin's page. */
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
  const result = await requestTakeover(
    actor,
    id,
    { relationship: body.value.relationship, reason: body.value.reason },
    correlationId,
  );
  if (!result.ok) {
    if (result.error === "AUTH_REQUIRED") {
      return jsonError("AUTH_REQUIRED", correlationId);
    }
    if (result.error === "MEMORIAL_NOT_FOUND") {
      return jsonError("MEMORIAL_NOT_FOUND", correlationId);
    }
    return jsonUnprocessable(correlationId, { reason: [result.error] });
  }
  return jsonSuccess(result.value, correlationId, 201);
}

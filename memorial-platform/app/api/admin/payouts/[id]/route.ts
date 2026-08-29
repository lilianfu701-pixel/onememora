import { z } from "zod";
import {
  correlationIdFrom,
  jsonError,
  jsonSuccess,
  readJson,
} from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import { decidePayout } from "@/modules/offerings/payouts";

export const dynamic = "force-dynamic";

const schema = z.object({
  decision: z.enum(["paid", "rejected"]),
  note: z.string().trim().max(300).optional(),
  providerRef: z.string().trim().max(120).optional(),
});

/** Super-admin marks a payout request paid (after sending money) or rejected. */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const correlationId = correlationIdFrom(request);
  const actor = await currentActor();
  if (actor.platformRole !== "super_admin") {
    return jsonError("MEMORIAL_NOT_FOUND", correlationId);
  }

  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success) {
    return jsonError("INVALID_INPUT", correlationId);
  }

  const body = await readJson(request, schema, correlationId);
  if (!body.ok) return body.response;

  const result = await decidePayout(
    actor,
    id,
    body.value.decision,
    body.value.note ?? null,
    body.value.providerRef ?? null,
  );
  if (!result.ok) {
    return jsonError("INVALID_INPUT", correlationId);
  }
  return jsonSuccess({ status: result.value.status }, correlationId, 200);
}

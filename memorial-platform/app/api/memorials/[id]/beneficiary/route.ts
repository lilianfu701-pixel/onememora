import { z } from "zod";
import {
  correlationIdFrom,
  jsonError,
  jsonSuccess,
  readJson,
} from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import { enrolBeneficiary } from "@/modules/offerings/payouts";

export const dynamic = "force-dynamic";

const schema = z.object({
  legalName: z.string().trim().min(2).max(80),
  method: z.enum(["bank", "alipay", "usdt"]),
  account: z.string().trim().min(4).max(120),
});

/** Owner enrols the family's payout recipient. Resets status to pending review. */
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
  const result = await enrolBeneficiary(actor, id, body.value);
  if (!result.ok) {
    if (result.error === "AUTH_REQUIRED") {
      return jsonError("AUTH_REQUIRED", correlationId);
    }
    if (result.error === "FORBIDDEN" || result.error === "NOT_FOUND") {
      return jsonError("MEMORIAL_NOT_FOUND", correlationId);
    }
    return jsonError("INVALID_INPUT", correlationId);
  }
  return jsonSuccess({ id: result.value.id }, correlationId, 200);
}

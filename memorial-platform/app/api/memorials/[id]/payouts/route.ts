import { z } from "zod";
import { correlationIdFrom, jsonError, jsonSuccess } from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import { requestPayout } from "@/modules/offerings/payouts";

export const dynamic = "force-dynamic";

/** Owner requests a gift-out of everything currently available. */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const correlationId = correlationIdFrom(request);
  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success) {
    return jsonError("MEMORIAL_NOT_FOUND", correlationId);
  }

  const actor = await currentActor();
  const result = await requestPayout(actor, id);
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

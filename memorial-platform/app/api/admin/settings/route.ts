import { z } from "zod";
import { correlationIdFrom, jsonError, jsonSuccess, readJson } from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import { setRates } from "@/modules/settings/rates";

export const dynamic = "force-dynamic";

const schema = z.object({
  collect: z.number().min(1).max(20).optional(),
  payout: z.number().min(1).max(20).optional(),
});

/** Save runtime platform settings (FX rates). Super-admins only. */
export async function POST(request: Request): Promise<Response> {
  const correlationId = correlationIdFrom(request);
  const actor = await currentActor();
  if (actor.platformRole !== "super_admin") {
    return jsonError("MEMORIAL_NOT_FOUND", correlationId);
  }

  const body = await readJson(request, schema, correlationId);
  if (!body.ok) {
    return body.response;
  }

  await setRates({
    ...(body.value.collect !== undefined ? { collect: body.value.collect } : {}),
    ...(body.value.payout !== undefined ? { payout: body.value.payout } : {}),
  });

  return jsonSuccess({ ok: true }, correlationId, 200);
}

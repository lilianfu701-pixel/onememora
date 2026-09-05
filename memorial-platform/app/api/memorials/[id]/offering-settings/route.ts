import { z } from "zod";
import {
  correlationIdFrom,
  jsonError,
  jsonSuccess,
  readJson,
} from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import { memorialRoleFor } from "@/modules/memorials/membership";
import { canOnMemorial } from "@/modules/permissions/policy";
import {
  TOGGLEABLE_OFFERINGS,
  getOfferingsDisabled,
  setOfferingsDisabled,
} from "@/modules/offerings/settings";

export const dynamic = "force-dynamic";

const schema = z.object({
  disabled: z.array(z.enum(TOGGLEABLE_OFFERINGS)).max(TOGGLEABLE_OFFERINGS.length),
});

/** The family switches individual offerings (incense/candle/wreath/donation)
 * on or off for their memorial. Owner-only. */
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const correlationId = correlationIdFrom(request);
  const { id } = await context.params;

  if (!z.uuid().safeParse(id).success) {
    return jsonError("MEMORIAL_NOT_FOUND", correlationId);
  }

  const actor = await currentActor();
  if (!actor.userId) {
    return jsonError("AUTH_REQUIRED", correlationId);
  }

  const role = await memorialRoleFor(id, actor.userId);
  if (!role) {
    return jsonError("MEMORIAL_NOT_FOUND", correlationId);
  }
  if (!canOnMemorial({ actor, role, action: "configure_rituals" })) {
    return jsonError("MEMORIAL_FORBIDDEN", correlationId);
  }

  const body = await readJson(request, schema, correlationId);
  if (!body.ok) {
    return body.response;
  }

  await setOfferingsDisabled(id, body.value.disabled);
  const disabled = await getOfferingsDisabled(id);
  return jsonSuccess({ disabled }, correlationId);
}

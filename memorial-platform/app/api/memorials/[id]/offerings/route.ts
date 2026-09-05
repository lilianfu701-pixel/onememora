import { z } from "zod";
import {
  correlationIdFrom,
  jsonError,
  jsonSuccess,
  readJson,
} from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import { createOffering } from "@/modules/offerings/create";
import { gateOffering } from "@/modules/offerings/gating";

export const dynamic = "force-dynamic";

/**
 * Leaves an offering on a memorial.
 *
 * Development stage: payment is skipped. A paid offering (candle, wreath) or a
 * donation is recorded immediately so the altar can be seen working. When the
 * payment flow lands, the client will settle first and only then call this with
 * the resulting order — the recording logic stays the same.
 */
const schema = z.object({
  slug: z.enum(["incense", "candle", "wreath", "donation"]),
  name: z.string().trim().max(60).optional(),
  message: z.string().trim().max(200).optional(),
  masked: z.boolean().optional().default(false),
  amountMinor: z.number().int().positive().max(100_000_000).optional(),
});

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
  if (!body.ok) {
    return body.response;
  }

  const gate = await gateOffering(id, body.value.slug);
  if (!gate.ok) {
    if (gate.error === "MEMORIAL_NOT_FOUND") {
      return jsonError("MEMORIAL_NOT_FOUND", correlationId);
    }
    // Page awaiting a family claim, or this offering switched off by the family.
    return jsonError("FEATURE_DISABLED", correlationId);
  }

  // Donations are custom-amount with a ¥99 floor.
  if (
    body.value.slug === "donation" &&
    (!body.value.amountMinor || body.value.amountMinor < 9900)
  ) {
    return jsonError("INVALID_INPUT", correlationId, {
      amountMinor: ["invalid"],
    });
  }

  const actor = await currentActor();

  const created = await createOffering({
    memorialId: id,
    slug: body.value.slug,
    giverUserId: actor.userId ?? null,
    name: body.value.name ?? null,
    message: body.value.message ?? null,
    masked: body.value.masked,
    amountMinor: body.value.amountMinor ?? null,
  });

  if (!created.ok) {
    return jsonError("INVALID_INPUT", correlationId);
  }

  return jsonSuccess(
    {
      id: created.value.id,
      slug: created.value.slug,
      displayName: created.value.displayName,
      message: created.value.message,
      amountMinor: created.value.amountMinor,
    },
    correlationId,
    201,
  );
}

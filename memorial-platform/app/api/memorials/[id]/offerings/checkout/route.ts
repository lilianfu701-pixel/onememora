import { z } from "zod";
import {
  correlationIdFrom,
  jsonError,
  jsonSuccess,
  readJson,
} from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import { createOfferingCheckout } from "@/modules/offerings/checkout";

export const dynamic = "force-dynamic";

/**
 * Starts payment for a paid offering (candle, wreath, donation) and returns a
 * Stripe Checkout URL for the client to redirect to. The offering is not
 * recorded here — the webhook does that once the payment settles.
 */
const schema = z.object({
  slug: z.enum(["candle", "wreath", "donation"]),
  name: z.string().trim().max(60).optional(),
  message: z.string().trim().max(200).optional(),
  masked: z.boolean().optional().default(false),
  amountMinor: z.number().int().positive().max(100_000_00).optional(),
  locale: z.string().trim().min(2).max(10).optional().default("zh-CN"),
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

  const actor = await currentActor();
  if (!actor.userId) {
    return jsonError("AUTH_REQUIRED", correlationId);
  }

  if (body.value.slug === "donation" && !body.value.amountMinor) {
    return jsonError("INVALID_INPUT", correlationId, {
      amountMinor: ["required"],
    });
  }

  const result = await createOfferingCheckout({
    memorialId: id,
    slug: body.value.slug,
    giverUserId: actor.userId,
    name: body.value.name ?? null,
    message: body.value.message ?? null,
    masked: body.value.masked,
    amountMinor: body.value.amountMinor ?? null,
    locale: body.value.locale,
  });

  if (!result.ok) {
    if (result.error === "MEMORIAL_NOT_FOUND") {
      return jsonError("MEMORIAL_NOT_FOUND", correlationId);
    }
    if (result.error === "INVALID_AMOUNT") {
      return jsonError("INVALID_INPUT", correlationId, {
        amountMinor: ["invalid"],
      });
    }
    return jsonError("CHECKOUT_FAILED", correlationId);
  }

  return jsonSuccess({ url: result.value.url }, correlationId, 200);
}

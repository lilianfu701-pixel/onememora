import { z } from "zod";
import {
  correlationIdFrom,
  jsonError,
  jsonSuccess,
  readJson,
} from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import { createPaypalOrder } from "@/modules/offerings/paypal-checkout";

export const dynamic = "force-dynamic";

/**
 * Starts a PayPal payment for a paid offering and returns the approval URL for
 * the client to redirect to. The offering is recorded only after capture (on
 * return, and again by the webhook) — never here.
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

  const result = await createPaypalOrder({
    memorialId: id,
    giverUserId: actor.userId,
    locale: body.value.locale,
    slug: body.value.slug,
    name: body.value.name ?? null,
    message: body.value.message ?? null,
    masked: body.value.masked,
    amountMinor: body.value.amountMinor ?? null,
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
    // Payment provider keys are not set on this deployment yet — distinct from a
    // provider call that was attempted and failed, so the UI (and operator) can
    // tell "online payment isn't enabled" apart from "the payment errored".
    if (result.error === "NOT_CONFIGURED") {
      return jsonError("FEATURE_DISABLED", correlationId);
    }
    return jsonError("CHECKOUT_FAILED", correlationId);
  }

  return jsonSuccess({ url: result.value.url }, correlationId, 200);
}

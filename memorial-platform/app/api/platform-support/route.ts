import { z } from "zod";
import {
  correlationIdFrom,
  jsonError,
  jsonSuccess,
  readJson,
} from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import {
  PLATFORM_SUPPORT_MIN_MINOR,
  createPlatformSupportOrder,
} from "@/modules/support/platform-support";

export const dynamic = "force-dynamic";

const schema = z.object({
  amountMinor: z
    .number()
    .int()
    .min(PLATFORM_SUPPORT_MIN_MINOR)
    .max(100_000_00),
  locale: z.string().trim().min(2).max(10).optional().default("zh-CN"),
});

/**
 * Starts a PayPal payment that funds the platform (the "资助追思网平台" box) and
 * returns the approval URL for the client to redirect to. No sign-in required —
 * an anonymous visitor may support the site.
 */
export async function POST(request: Request): Promise<Response> {
  const correlationId = correlationIdFrom(request);

  const body = await readJson(request, schema, correlationId);
  if (!body.ok) {
    return body.response;
  }

  const actor = await currentActor();

  const result = await createPlatformSupportOrder({
    amountMinor: body.value.amountMinor,
    userId: actor.userId ?? null,
    locale: body.value.locale,
  });

  if (!result.ok) {
    if (result.error === "INVALID_AMOUNT") {
      return jsonError("INVALID_INPUT", correlationId, {
        amountMinor: ["invalid"],
      });
    }
    // Payment keys not set on this deployment — distinct from a call that failed.
    if (result.error === "NOT_CONFIGURED") {
      return jsonError("FEATURE_DISABLED", correlationId);
    }
    return jsonError("CHECKOUT_FAILED", correlationId);
  }

  return jsonSuccess({ url: result.value.url }, correlationId, 200);
}

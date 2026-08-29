import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { paypalFetch } from "@/lib/paypal";
import { settleOrderById } from "@/modules/offerings/paypal-checkout";

export const dynamic = "force-dynamic";

const log = logger("paypal-webhook");

/**
 * PayPal webhook. Verifies the signature with PayPal, then settles the order on
 * a completed capture. Idempotent: settling a non-pending order is a no-op, so
 * the return handler and this webhook can both fire safely.
 */
export async function POST(request: Request): Promise<Response> {
  const e = env();
  if (!e.PAYPAL_WEBHOOK_ID) {
    return new Response("not configured", { status: 500 });
  }

  const raw = await request.text();
  const h = request.headers;

  let event: { event_type?: string; resource?: { custom_id?: string } };
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response("bad body", { status: 400 });
  }

  let verified = false;
  try {
    const res = await paypalFetch<{ verification_status?: string }>(
      "/v1/notifications/verify-webhook-signature",
      {
        method: "POST",
        body: {
          auth_algo: h.get("paypal-auth-algo"),
          cert_url: h.get("paypal-cert-url"),
          transmission_id: h.get("paypal-transmission-id"),
          transmission_sig: h.get("paypal-transmission-sig"),
          transmission_time: h.get("paypal-transmission-time"),
          webhook_id: e.PAYPAL_WEBHOOK_ID,
          webhook_event: event,
        },
      },
    );
    verified = res.ok && res.data.verification_status === "SUCCESS";
  } catch {
    verified = false;
  }

  if (!verified) {
    return new Response("bad signature", { status: 400 });
  }

  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    const orderId = event.resource?.custom_id;
    if (orderId) {
      try {
        await settleOrderById(orderId);
      } catch (error) {
        log.error("settle_failed", {
          orderId,
          message: error instanceof Error ? error.message : "unknown",
        });
        return new Response("retry", { status: 500 });
      }
    }
  }

  return new Response("ok", { status: 200 });
}

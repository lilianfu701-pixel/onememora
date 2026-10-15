import type Stripe from "stripe";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { stripe } from "@/lib/stripe";
import { settlePaidOrder } from "@/modules/offerings/settle";

export const dynamic = "force-dynamic";

const log = logger("stripe-webhook");

/**
 * Stripe webhook. The signed raw body proves the event came from Stripe; a paid
 * Checkout session settles its pending order (an offering lands on the altar, a
 * platform gift is marked paid). It backs up `/api/stripe/return` for payers who
 * close the tab before coming back, and covers asynchronous payment methods.
 */
export async function POST(request: Request): Promise<Response> {
  const secret = env().STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return new Response("not configured", { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("missing signature", { status: 400 });
  }

  const raw = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, signature, secret);
  } catch {
    return new Response("bad signature", { status: 400 });
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object;
    const orderId = session.client_reference_id ?? session.metadata?.orderId;
    if (session.payment_status === "paid" && orderId) {
      try {
        await settlePaidOrder(orderId);
      } catch (error) {
        // Let Stripe retry on a transient failure rather than swallow it.
        log.error("settle_failed", {
          sessionId: session.id,
          message: error instanceof Error ? error.message : "unknown",
        });
        return new Response("retry", { status: 500 });
      }
    }
  }

  return new Response("ok", { status: 200 });
}

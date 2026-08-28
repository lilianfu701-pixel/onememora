import type Stripe from "stripe";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { orders } from "@/db/schema";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { stripe } from "@/lib/stripe";
import { OFFERING_CATALOG, type OfferingSlug } from "@/modules/offerings/catalog";
import { createOffering } from "@/modules/offerings/create";

export const dynamic = "force-dynamic";

const log = logger("stripe-webhook");

/**
 * Stripe webhook. The signed raw body proves the event came from Stripe; a paid
 * Checkout session settles its pending order and records the offering. Recording
 * happens here — never in the client — so payment is the only thing that can
 * put an offering on the altar.
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
    if (session.payment_status === "paid") {
      try {
        await settleSession(session);
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

async function settleSession(session: Stripe.Checkout.Session): Promise<void> {
  const md = session.metadata ?? {};
  const orderId = md.orderId;
  const slug = md.slug;
  if (!orderId || !slug || !isOfferingSlug(slug)) return;

  // Claim the order atomically: only a still-pending row flips to paid, so a
  // duplicate webhook delivery records the offering at most once.
  const claimed = await db()
    .update(orders)
    .set({ status: "paid" })
    .where(and(eq(orders.id, orderId), eq(orders.status, "pending")))
    .returning({ id: orders.id, memorialId: orders.memorialId });

  const order = claimed[0];
  if (!order || !order.memorialId) return;

  await createOffering({
    memorialId: order.memorialId,
    slug,
    giverUserId: md.giverUserId || null,
    name: md.name || null,
    message: md.message || null,
    masked: md.masked === "1",
    amountMinor: md.amountMinor ? Number(md.amountMinor) : null,
    orderId,
  });
}

function isOfferingSlug(value: string): value is OfferingSlug {
  return value in OFFERING_CATALOG;
}

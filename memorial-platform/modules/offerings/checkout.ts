import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { memorials, orders } from "@/db/schema";
import { env } from "@/lib/env";
import { err, ok } from "@/lib/result";
import type { Result } from "@/lib/result";
import { stripe } from "@/lib/stripe";
import { OFFERING_CATALOG, PLATFORM_FEE_RATE } from "./catalog";

export type CheckoutError =
  | "MEMORIAL_NOT_FOUND"
  | "INVALID_AMOUNT"
  | "NOT_CONFIGURED";

/** The offerings that cost money. Incense is free and never comes here. */
type PaidSlug = "candle" | "wreath" | "donation";

export interface CheckoutInput {
  memorialId: string;
  slug: PaidSlug;
  /** Must be a signed-in user — an order is always tied to an account. */
  giverUserId: string;
  name?: string | null;
  message?: string | null;
  masked?: boolean;
  /** Required for donations, in minor units (分); ignored for fixed prices. */
  amountMinor?: number | null;
  /** Locale segment, used only to route the visitor back after payment. */
  locale: string;
}

const DONATION_MIN_MINOR = 100; // ¥1
const DONATION_MAX_MINOR = 100_000_00; // ¥100,000

const PRODUCT_NAME: Record<PaidSlug, string> = {
  candle: "点烛供奉",
  wreath: "献花圈供奉",
  donation: "捐款",
};

/**
 * Starts a Stripe Checkout for a paid offering.
 *
 * A pending `orders` row is written first so a completed payment always has a
 * row to settle against (the webhook reconciles it). The offering itself is
 * only recorded once payment succeeds — never here. Card, Alipay and WeChat Pay
 * are all offered through the one Checkout session.
 */
export async function createOfferingCheckout(
  input: CheckoutInput,
): Promise<Result<{ url: string }, CheckoutError>> {
  if (!env().STRIPE_SECRET_KEY) return err("NOT_CONFIGURED");

  const entry = OFFERING_CATALOG[input.slug];
  const amountMinor =
    input.slug === "donation"
      ? Math.trunc(input.amountMinor ?? 0)
      : entry.priceMinor;

  if (
    input.slug === "donation" &&
    (amountMinor < DONATION_MIN_MINOR || amountMinor > DONATION_MAX_MINOR)
  ) {
    return err("INVALID_AMOUNT");
  }
  if (amountMinor <= 0) return err("INVALID_AMOUNT");

  const [memorial] = await db()
    .select({
      id: memorials.id,
      slug: memorials.slug,
      status: memorials.status,
    })
    .from(memorials)
    .where(eq(memorials.id, input.memorialId));

  if (!memorial || memorial.status !== "published") {
    return err("MEMORIAL_NOT_FOUND");
  }

  const feeMinor = Math.round(amountMinor * PLATFORM_FEE_RATE);

  const [order] = await db()
    .insert(orders)
    .values({
      userId: input.giverUserId,
      status: "pending",
      amountMinor,
      currency: "CNY",
      kind: `offering:${input.slug}`,
      memorialId: input.memorialId,
      provider: "stripe",
      feeMinor,
    })
    .returning({ id: orders.id });

  const orderId = order!.id;

  const base = env().APP_URL.replace(/\/$/, "");
  const back = `${base}/${encodeURIComponent(input.locale)}/memorials/${memorial.slug}`;
  const rawName = (input.name?.trim() ?? "").slice(0, 60);
  const message = (input.message?.trim() ?? "").slice(0, 200);

  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card", "alipay", "wechat_pay"],
    payment_method_options: { wechat_pay: { client: "web" } },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "cny",
          unit_amount: amountMinor,
          product_data: { name: PRODUCT_NAME[input.slug] },
        },
      },
    ],
    client_reference_id: orderId,
    // Everything the webhook needs to record the offering after payment.
    metadata: {
      orderId,
      memorialId: input.memorialId,
      slug: input.slug,
      giverUserId: input.giverUserId,
      name: rawName,
      masked: input.masked ? "1" : "0",
      message,
      amountMinor: String(amountMinor),
    },
    success_url: `${back}?offer=success`,
    cancel_url: `${back}?offer=cancel`,
  });

  if (!session.url) return err("NOT_CONFIGURED");

  await db()
    .update(orders)
    .set({ providerSessionId: session.id })
    .where(eq(orders.id, orderId));

  return ok({ url: session.url });
}

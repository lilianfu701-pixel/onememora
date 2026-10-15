import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { orders } from "@/db/schema";
import { env } from "@/lib/env";
import { err, ok } from "@/lib/result";
import type { Result } from "@/lib/result";
import { startStripeCheckout } from "@/lib/stripe";
import { OFFERING_CATALOG, PLATFORM_FEE_RATE } from "./catalog";
import { gateOffering } from "./gating";

export type CheckoutError =
  | "MEMORIAL_NOT_FOUND"
  | "AWAITING_CLAIM"
  | "OFFERING_DISABLED"
  | "INVALID_AMOUNT"
  | "NOT_CONFIGURED"
  | "PROVIDER_ERROR";

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

// Same bounds as the PayPal path, so the altar behaves the same either way.
const DONATION_MIN_MINOR = 9900; // ¥99
const DONATION_MAX_MINOR = 100_000_00; // ¥100,000

const PRODUCT_NAME: Record<PaidSlug, string> = {
  candle: "点烛供奉",
  wreath: "献花圈供奉",
  donation: "捐款",
};

/**
 * Starts a Stripe Checkout (card, Alipay, WeChat Pay) for a paid offering.
 *
 * A pending `orders` row is written first, with the offering intent in `meta`
 * exactly as the PayPal path stores it, so the same `settleOrderById` records
 * the offering once payment succeeds — never here.
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

  const gate = await gateOffering(input.memorialId, input.slug);
  if (!gate.ok) return err(gate.error);
  const memorialSlug = gate.value.memorialSlug;

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
      feeMinor: Math.round(amountMinor * PLATFORM_FEE_RATE),
      meta: {
        slug: input.slug,
        name: input.name?.trim() || null,
        masked: Boolean(input.masked),
        message: input.message?.trim() || null,
      },
    })
    .returning({ id: orders.id });

  const orderId = order!.id;
  const base = env().APP_URL.replace(/\/$/, "");
  const locale = encodeURIComponent(input.locale);

  const session = await startStripeCheckout({
    orderId,
    amountMinor,
    productName: PRODUCT_NAME[input.slug],
    locale: input.locale,
    cancelUrl: `${base}/${locale}/memorials/${memorialSlug}?offer=cancel`,
  }).catch(() => null);
  if (!session) return err("PROVIDER_ERROR");

  await db()
    .update(orders)
    .set({ providerSessionId: session.sessionId })
    .where(eq(orders.id, orderId));

  return ok({ url: session.url });
}

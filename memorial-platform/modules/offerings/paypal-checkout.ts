import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { memorials, orders } from "@/db/schema";
import { env } from "@/lib/env";
import { err, ok } from "@/lib/result";
import type { Result } from "@/lib/result";
import { paypalFetch } from "@/lib/paypal";
import { collectRate } from "@/modules/settings/rates";
import { OFFERING_CATALOG, PLATFORM_FEE_RATE } from "./catalog";
import { createOffering } from "./create";

export type PaypalCheckoutError =
  | "MEMORIAL_NOT_FOUND"
  | "INVALID_AMOUNT"
  | "NOT_CONFIGURED"
  | "PROVIDER_ERROR";

type PaidSlug = "candle" | "wreath" | "donation";

/** The offering intent, stashed on the order to survive the redirect. */
interface OfferingIntent {
  slug: PaidSlug;
  name: string | null;
  masked: boolean;
  message: string | null;
}

const DONATION_MIN_MINOR = 100; // ¥1
const DONATION_MAX_MINOR = 100_000_00; // ¥100,000

const PRODUCT_NAME: Record<PaidSlug, string> = {
  candle: "点烛供奉",
  wreath: "献花圈供奉",
  donation: "捐款",
};

/** PayPal cannot charge CNY, so RMB is converted to USD at the buy-in rate. */
async function usdValueFromCny(cnyMinor: number): Promise<string> {
  const rate = await collectRate();
  const usd = cnyMinor / 100 / rate;
  return Math.max(0.01, usd).toFixed(2);
}

export interface PaypalCheckoutInput {
  memorialId: string;
  giverUserId: string;
  locale: string;
  slug: PaidSlug;
  name?: string | null;
  message?: string | null;
  masked?: boolean;
  amountMinor?: number | null;
}

/**
 * Creates a PayPal order for a paid offering and returns the approval URL. A
 * pending `orders` row (in RMB) is written first, with the offering intent in
 * `meta`, so the return/webhook can record the offering after capture. Money is
 * charged in USD (converted from the RMB price); bookkeeping stays in RMB.
 */
export async function createPaypalOrder(
  input: PaypalCheckoutInput,
): Promise<Result<{ url: string }, PaypalCheckoutError>> {
  const e = env();
  if (!e.PAYPAL_CLIENT_ID || !e.PAYPAL_CLIENT_SECRET) {
    return err("NOT_CONFIGURED");
  }

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
  const intent: OfferingIntent = {
    slug: input.slug,
    name: input.name?.trim() || null,
    masked: Boolean(input.masked),
    message: input.message?.trim() || null,
  };

  const [order] = await db()
    .insert(orders)
    .values({
      userId: input.giverUserId,
      status: "pending",
      amountMinor,
      currency: "CNY",
      kind: `offering:${input.slug}`,
      memorialId: input.memorialId,
      provider: "paypal",
      feeMinor,
      meta: intent,
    })
    .returning({ id: orders.id });

  const orderId = order!.id;
  const usdValue = await usdValueFromCny(amountMinor);
  const base = e.APP_URL.replace(/\/$/, "");
  const locale = encodeURIComponent(input.locale);
  const returnUrl = `${base}/api/paypal/return?o=${orderId}&l=${locale}`;
  const cancelUrl = `${base}/${locale}/memorials/${memorial.slug}?offer=cancel`;

  const res = await paypalFetch<{
    id?: string;
    links?: { href: string; rel: string }[];
  }>("/v2/checkout/orders", {
    method: "POST",
    body: {
      intent: "CAPTURE",
      purchase_units: [
        {
          custom_id: orderId,
          description: PRODUCT_NAME[input.slug],
          amount: { currency_code: "USD", value: usdValue },
        },
      ],
      application_context: {
        brand_name: "missingu",
        user_action: "PAY_NOW",
        shipping_preference: "NO_SHIPPING",
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    },
  });

  if (!res.ok || !res.data.id) return err("PROVIDER_ERROR");

  await db()
    .update(orders)
    .set({ providerSessionId: res.data.id })
    .where(eq(orders.id, orderId));

  const approve = res.data.links?.find(
    (l) => l.rel === "approve" || l.rel === "payer-action",
  );
  if (!approve) return err("PROVIDER_ERROR");

  return ok({ url: approve.href });
}

/** Captures a PayPal order. An already-captured order counts as success. */
export async function capturePaypalOrder(
  paypalOrderId: string,
): Promise<boolean> {
  const res = await paypalFetch<unknown>(
    `/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`,
    { method: "POST", body: {} },
  );
  if (res.ok) return true;
  return JSON.stringify(res.data).includes("ORDER_ALREADY_CAPTURED");
}

/**
 * Settles our pending order once payment is captured: flips it to paid
 * (atomically, so a duplicate return/webhook records the offering at most once)
 * and writes the offering from the intent saved on the order.
 */
export async function settleOrderById(ourOrderId: string): Promise<void> {
  const claimed = await db()
    .update(orders)
    .set({ status: "paid" })
    .where(and(eq(orders.id, ourOrderId), eq(orders.status, "pending")))
    .returning({
      id: orders.id,
      memorialId: orders.memorialId,
      userId: orders.userId,
      amountMinor: orders.amountMinor,
      meta: orders.meta,
    });

  const order = claimed[0];
  if (!order || !order.memorialId) return;

  const meta = (order.meta ?? {}) as Partial<OfferingIntent>;
  if (meta.slug !== "candle" && meta.slug !== "wreath" && meta.slug !== "donation") {
    return;
  }

  await createOffering({
    memorialId: order.memorialId,
    slug: meta.slug,
    giverUserId: order.userId,
    name: meta.name ?? null,
    message: meta.message ?? null,
    masked: Boolean(meta.masked),
    amountMinor: Number(order.amountMinor),
    orderId: ourOrderId,
  });
}

/** The memorial slug an order belongs to, for post-payment redirects. */
export async function orderMemorialSlug(
  ourOrderId: string,
): Promise<string | null> {
  const [row] = await db()
    .select({ slug: memorials.slug })
    .from(orders)
    .innerJoin(memorials, eq(memorials.id, orders.memorialId))
    .where(eq(orders.id, ourOrderId));
  return row?.slug ?? null;
}

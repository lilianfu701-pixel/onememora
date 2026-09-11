import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { orders } from "@/db/schema";
import { env } from "@/lib/env";
import { err, ok } from "@/lib/result";
import type { Result } from "@/lib/result";
import { paypalFetch } from "@/lib/paypal";
import { collectRate } from "@/modules/settings/rates";

/** The `kind` marking an order as a gift to the platform, not to a family. */
export const PLATFORM_SUPPORT_KIND = "platform_support";

/** ¥9.9 floor — a real contribution, not a test transaction. */
export const PLATFORM_SUPPORT_MIN_MINOR = 990;
const PLATFORM_SUPPORT_MAX_MINOR = 100_000_00; // ¥100,000

export type PlatformSupportError =
  | "INVALID_AMOUNT"
  | "NOT_CONFIGURED"
  | "PROVIDER_ERROR";

export interface PlatformSupportInput {
  amountMinor: number;
  /** The signed-in supporter, or null for an anonymous gift. */
  userId: string | null;
  locale: string;
}

/** PayPal cannot charge CNY, so RMB is converted to USD at the buy-in rate. */
async function usdValueFromCny(cnyMinor: number): Promise<string> {
  const rate = await collectRate();
  const usd = cnyMinor / 100 / rate;
  return Math.max(0.01, usd).toFixed(2);
}

/**
 * Starts a PayPal payment that funds the platform itself, and returns the
 * approval URL.
 *
 * The whole amount is the platform's: the order carries no `memorialId` and its
 * `feeMinor` equals the amount, so the family ledgers and payout views never see
 * it and "net owed to families" stays honest. RMB is charged in USD; bookkeeping
 * stays in RMB, like every other order.
 */
export async function createPlatformSupportOrder(
  input: PlatformSupportInput,
): Promise<Result<{ url: string }, PlatformSupportError>> {
  const e = env();
  if (!e.PAYPAL_CLIENT_ID || !e.PAYPAL_CLIENT_SECRET) {
    return err("NOT_CONFIGURED");
  }

  const amountMinor = Math.trunc(input.amountMinor);
  if (
    !Number.isFinite(amountMinor) ||
    amountMinor < PLATFORM_SUPPORT_MIN_MINOR ||
    amountMinor > PLATFORM_SUPPORT_MAX_MINOR
  ) {
    return err("INVALID_AMOUNT");
  }

  const [order] = await db()
    .insert(orders)
    .values({
      userId: input.userId,
      status: "pending",
      amountMinor,
      currency: "CNY",
      kind: PLATFORM_SUPPORT_KIND,
      memorialId: null,
      provider: "paypal",
      // The platform keeps all of it — recorded as 100% fee so the family "net"
      // aggregations exclude it without any special-casing.
      feeMinor: amountMinor,
      meta: { kind: PLATFORM_SUPPORT_KIND, locale: input.locale },
    })
    .returning({ id: orders.id });

  const orderId = order!.id;
  const usdValue = await usdValueFromCny(amountMinor);
  const base = e.APP_URL.replace(/\/$/, "");
  const locale = encodeURIComponent(input.locale);
  const returnUrl = `${base}/api/paypal/return?o=${orderId}&l=${locale}`;
  const cancelUrl = `${base}/${locale}/support?state=cancel`;

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
          description: "Support missingu.org",
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

/**
 * Marks a captured platform-support order paid. Idempotent (the status guard
 * makes a duplicate return/webhook a no-op) and side-effect-free — there is no
 * family to credit.
 */
export async function settlePlatformSupportOrder(
  orderId: string,
): Promise<void> {
  await db()
    .update(orders)
    .set({ status: "paid" })
    .where(
      and(
        eq(orders.id, orderId),
        eq(orders.status, "pending"),
        eq(orders.kind, PLATFORM_SUPPORT_KIND),
      ),
    );
}

/** Whether an order is a platform-support gift, for routing the payer back. */
export async function isPlatformSupportOrder(
  orderId: string,
): Promise<boolean> {
  const [row] = await db()
    .select({ kind: orders.kind })
    .from(orders)
    .where(eq(orders.id, orderId));
  return row?.kind === PLATFORM_SUPPORT_KIND;
}

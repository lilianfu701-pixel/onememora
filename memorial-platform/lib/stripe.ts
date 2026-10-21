import Stripe from "stripe";
import { env } from "./env";

let client: Stripe | null = null;

/**
 * Lazily-built Stripe client.
 *
 * The secret is only required at the moment a payment is actually created or a
 * webhook is verified — never at build time — so a deploy without the key still
 * compiles and the rest of the site runs. Callers that reach this without a key
 * get a clear error rather than a silent misconfiguration.
 */
export function stripe(): Stripe {
  if (client) return client;
  const key = env().STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  client = new Stripe(key);
  return client;
}

/** Whether Stripe is configured, so callers can fail cleanly before using it. */
export function stripeConfigured(): boolean {
  return Boolean(env().STRIPE_SECRET_KEY);
}

/** Our locale segment → the language Stripe's hosted Checkout page shows. */
function checkoutLocale(
  locale: string,
): Stripe.Checkout.SessionCreateParams.Locale {
  const map: Record<string, Stripe.Checkout.SessionCreateParams.Locale> = {
    "zh-CN": "zh",
    "zh-TW": "zh-TW",
    "zh-HK": "zh-HK",
    "zh-MO": "zh-HK",
    en: "en",
    es: "es",
    fr: "fr",
    de: "de",
    ja: "ja",
    ko: "ko",
    ru: "ru",
    id: "id",
    vi: "vi",
    "pt-BR": "pt-BR",
    "pt-PT": "pt",
  };
  return map[locale] ?? "auto";
}

export interface StripeCheckoutInput {
  /** Our pending `orders.id`; ties the Stripe session back to the order. */
  orderId: string;
  /** RMB in minor units (分). Stripe charges CNY directly — no conversion. */
  amountMinor: number;
  productName: string;
  locale: string;
  cancelUrl: string;
}

/**
 * Opens a hosted Stripe Checkout session for one of our pending orders and
 * returns its id and URL.
 *
 * Payment methods are left to the Dashboard (card, Alipay, WeChat Pay — whatever
 * is switched on there), so a method still awaiting Stripe approval never breaks
 * checkout. The payer comes back through `/api/stripe/return`, which settles the
 * order; the webhook is the backup.
 */
export async function startStripeCheckout(
  input: StripeCheckoutInput,
): Promise<{ sessionId: string; url: string } | null> {
  const base = env().APP_URL.replace(/\/$/, "");
  const locale = encodeURIComponent(input.locale);
  // {CHECKOUT_SESSION_ID} is substituted by Stripe — it must stay unencoded.
  const successUrl = `${base}/api/stripe/return?o=${input.orderId}&l=${locale}&s={CHECKOUT_SESSION_ID}`;

  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    // Alipay was never approved on the Stripe account, so offer only WeChat Pay
    // and cards — listing Alipay left customers at a method that always failed.
    payment_method_types: ["card", "wechat_pay"],
    payment_method_options: { wechat_pay: { client: "web" } },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "cny",
          unit_amount: input.amountMinor,
          product_data: { name: input.productName },
        },
      },
    ],
    client_reference_id: input.orderId,
    metadata: { orderId: input.orderId },
    payment_intent_data: { metadata: { orderId: input.orderId } },
    locale: checkoutLocale(input.locale),
    success_url: successUrl,
    cancel_url: input.cancelUrl,
  });

  if (!session.url) return null;
  return { sessionId: session.id, url: session.url };
}

/**
 * Whether a Checkout session has been paid for the given order. Checked against
 * Stripe itself, so a forged return URL cannot mark anything paid.
 */
export async function stripeSessionPaid(
  sessionId: string,
  orderId: string,
): Promise<boolean> {
  const session = await stripe().checkout.sessions.retrieve(sessionId);
  return (
    session.client_reference_id === orderId && session.payment_status === "paid"
  );
}

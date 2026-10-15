import { env } from "./env";

/** The processors a payer can choose between. */
export type PaymentProvider = "stripe" | "paypal";

/**
 * The payment providers configured on this deployment, in display order.
 * Stripe comes first: it carries Alipay and WeChat Pay, which most of our
 * Chinese-speaking payers use. An empty list means online payment is off.
 */
export function availablePaymentProviders(): PaymentProvider[] {
  const e = env();
  const providers: PaymentProvider[] = [];
  if (e.STRIPE_SECRET_KEY) providers.push("stripe");
  if (e.PAYPAL_CLIENT_ID && e.PAYPAL_CLIENT_SECRET) providers.push("paypal");
  return providers;
}

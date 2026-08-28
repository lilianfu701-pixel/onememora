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

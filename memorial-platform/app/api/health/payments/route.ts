import { env } from "@/lib/env";
import { paypalConfigured, paypalTokenCheck } from "@/lib/paypal";

/**
 * Payments configuration probe.
 *
 * Reveals only whether the PayPal collection processor has its credentials set
 * and which environment it targets — two booleans about our own deploy, no
 * secrets. Lets an operator confirm a go-live env change actually took effect
 * without opening the Vercel dashboard. Runtime-only (force-dynamic), so it
 * reads env at request time rather than at build.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(): Promise<Response> {
  const e = env();
  // Live token probe so an operator can tell "keys present" from "keys valid".
  const token = await paypalTokenCheck();
  return Response.json(
    {
      paypal: {
        configured: paypalConfigured(),
        webhookConfigured: Boolean(e.PAYPAL_WEBHOOK_ID),
        env: e.PAYPAL_ENV,
        tokenOk: token.ok,
        tokenStatus: token.status,
        // Length-only fingerprints so a truncated/space-padded paste is visible
        // without ever revealing the value.
        clientIdLen: (e.PAYPAL_CLIENT_ID ?? "").length,
        secretLen: (e.PAYPAL_CLIENT_SECRET ?? "").length,
      },
      // The base the PayPal return URL is built from — must be the live site.
      appUrlHost: (() => {
        try {
          return new URL(e.APP_URL).host;
        } catch {
          return null;
        }
      })(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

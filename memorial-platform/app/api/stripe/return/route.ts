import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { stripeSessionPaid } from "@/lib/stripe";
import { orderMemorialSlug } from "@/modules/offerings/paypal-checkout";
import { settlePaidOrder } from "@/modules/offerings/settle";
import { isPlatformSupportOrder } from "@/modules/support/platform-support";

export const dynamic = "force-dynamic";

const log = logger("stripe-return");

/**
 * Where Stripe Checkout sends the payer after a successful payment. We confirm
 * the session with Stripe (never trusting the URL alone), settle the order and
 * return the payer to the memorial or the platform thank-you page. The webhook
 * settles the same order if the payer never lands here.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("o");
  const sessionId = url.searchParams.get("s");
  const rawLocale = url.searchParams.get("l") ?? "zh-CN";
  const locale = /^[a-zA-Z-]{2,10}$/.test(rawLocale) ? rawLocale : "zh-CN";

  const base = env().APP_URL.replace(/\/$/, "");
  const home = `${base}/${locale}`;
  if (!orderId || !/^[0-9a-f-]{36}$/i.test(orderId)) {
    return NextResponse.redirect(home);
  }

  const isPlatform = await isPlatformSupportOrder(orderId);

  let paid = false;
  try {
    if (sessionId && (await stripeSessionPaid(sessionId, orderId))) {
      await settlePaidOrder(orderId);
      paid = true;
    }
  } catch (error) {
    // The webhook will reconcile; send the payer back either way.
    log.error("return_settle_failed", {
      orderId,
      message: error instanceof Error ? error.message : "unknown",
    });
  }

  if (isPlatform) {
    return NextResponse.redirect(
      `${home}/support?state=${paid ? "thanks" : "cancel"}`,
    );
  }

  const slug = await orderMemorialSlug(orderId);
  const memorial = slug ? `${base}/${locale}/memorials/${slug}` : home;
  return NextResponse.redirect(
    `${memorial}?offer=${paid ? "success" : "cancel"}`,
  );
}

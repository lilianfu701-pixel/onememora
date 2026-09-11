import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import {
  capturePaypalOrder,
  orderMemorialSlug,
  settleOrderById,
} from "@/modules/offerings/paypal-checkout";
import {
  isPlatformSupportOrder,
  settlePlatformSupportOrder,
} from "@/modules/support/platform-support";

export const dynamic = "force-dynamic";

const log = logger("paypal-return");

/**
 * Where PayPal sends the payer back after approval. We capture the order and,
 * depending on what it was, record the offering and return to the memorial, or
 * settle the platform gift and return to a thank-you. The webhook is the backup
 * if the payer never lands here.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("o");
  const rawLocale = url.searchParams.get("l") ?? "zh-CN";
  const locale = /^[a-zA-Z-]{2,10}$/.test(rawLocale) ? rawLocale : "zh-CN";
  const paypalOrderId = url.searchParams.get("token");

  const base = env().APP_URL.replace(/\/$/, "");
  const home = `${base}/${locale}`;
  if (!orderId) return NextResponse.redirect(home);

  // A gift to the platform settles to a thank-you page, not to any memorial.
  const isPlatform = await isPlatformSupportOrder(orderId);

  let paid = false;
  try {
    if (paypalOrderId) {
      const captured = await capturePaypalOrder(paypalOrderId);
      if (captured) {
        if (isPlatform) {
          await settlePlatformSupportOrder(orderId);
        } else {
          await settleOrderById(orderId);
        }
        paid = true;
      }
    }
  } catch (error) {
    // The webhook will reconcile; send the visitor back either way.
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

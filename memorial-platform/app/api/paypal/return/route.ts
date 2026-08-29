import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import {
  capturePaypalOrder,
  orderMemorialSlug,
  settleOrderById,
} from "@/modules/offerings/paypal-checkout";

export const dynamic = "force-dynamic";

const log = logger("paypal-return");

/**
 * Where PayPal sends the payer back after approval. We capture the order,
 * record the offering, and redirect to the memorial. The webhook is the backup
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

  const slug = await orderMemorialSlug(orderId);
  const memorial = slug ? `${base}/${locale}/memorials/${slug}` : home;

  let paid = false;
  try {
    if (paypalOrderId) {
      const captured = await capturePaypalOrder(paypalOrderId);
      if (captured) {
        await settleOrderById(orderId);
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

  return NextResponse.redirect(
    `${memorial}?offer=${paid ? "success" : "cancel"}`,
  );
}

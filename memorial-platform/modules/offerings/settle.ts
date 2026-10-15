import { settleOrderById } from "./paypal-checkout";
import {
  isPlatformSupportOrder,
  settlePlatformSupportOrder,
} from "@/modules/support/platform-support";

/**
 * Settles one of our orders once its provider confirms payment, whichever kind
 * it is: a gift to the platform just flips to paid; an offering also lands on
 * the altar. Idempotent — both paths only act on a still-pending order — so the
 * return redirect and the webhook can both call it safely.
 */
export async function settlePaidOrder(orderId: string): Promise<void> {
  if (await isPlatformSupportOrder(orderId)) {
    await settlePlatformSupportOrder(orderId);
    return;
  }
  await settleOrderById(orderId);
}

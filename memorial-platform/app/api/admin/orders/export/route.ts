import { currentActor } from "@/modules/auth/current-user";
import { adminOrdersCsv } from "@/modules/offerings/orders-admin";

export const dynamic = "force-dynamic";

/** CSV of all payment orders, for reconciliation. Super-admins only. */
export async function GET(): Promise<Response> {
  const actor = await currentActor();
  if (actor.platformRole !== "super_admin") {
    return new Response("Not found", { status: 404 });
  }

  const csv = await adminOrdersCsv();
  const date = new Date().toISOString().slice(0, 10);
  // BOM so Excel opens the UTF-8 (Chinese) columns correctly.
  return new Response(`﻿${csv}`, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="missingu-orders-${date}.csv"`,
      "cache-control": "no-store",
    },
  });
}

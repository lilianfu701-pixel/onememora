import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  memorialBeneficiaries,
  memorialNames,
  memorials,
  orders,
  users,
} from "@/db/schema";
import { PLATFORM_FEE_RATE } from "./catalog";

/** Payment providers whose orders are money coming in (not plan/other rows). */
const PAYMENT_PROVIDERS = ["paypal", "stripe"] as const;

const FEE_SUM = sql<string>`coalesce(sum(coalesce(${orders.feeMinor}, round(${orders.amountMinor}::numeric * ${PLATFORM_FEE_RATE})::bigint)), 0)`;
const GROSS_SUM = sql<string>`coalesce(sum(${orders.amountMinor}), 0)`;

export interface AdminOrderRow {
  id: string;
  createdAt: Date;
  status: string;
  provider: string | null;
  kind: string | null;
  amountMinor: number;
  feeMinor: number;
  netMinor: number;
  currency: string;
  memorialSlug: string | null;
  memorialName: string | null;
  giver: string | null;
  providerRef: string | null;
}

/** Count + gross for one order status bucket. */
export interface StatusTotal {
  count: number;
  grossMinor: number;
}

export interface AdminOrdersResult {
  rows: AdminOrderRow[];
  /** All-time totals over *paid* payment orders. */
  totals: {
    count: number;
    grossMinor: number;
    feeMinor: number;
    netMinor: number;
  };
  /** Success vs. unfinished vs. failed, so they read apart at a glance. */
  byStatus: {
    paid: StatusTotal;
    pending: StatusTotal;
    failed: StatusTotal;
  };
}

function feeOf(amountMinor: number, feeMinor: number | null): number {
  return feeMinor ?? Math.round(amountMinor * PLATFORM_FEE_RATE);
}

function toRow(r: {
  id: string;
  createdAt: Date;
  status: string;
  provider: string | null;
  kind: string | null;
  amountMinor: number;
  feeMinor: number | null;
  currency: string | null;
  memorialSlug: string | null;
  memorialName: string | null;
  displayName: string | null;
  fullName: string | null;
  providerRef: string | null;
}): AdminOrderRow {
  const amount = Number(r.amountMinor);
  const fee = feeOf(amount, r.feeMinor === null ? null : Number(r.feeMinor));
  return {
    id: r.id,
    createdAt: r.createdAt,
    status: r.status,
    provider: r.provider,
    kind: r.kind,
    amountMinor: amount,
    feeMinor: fee,
    netMinor: amount - fee,
    currency: r.currency ?? "CNY",
    memorialSlug: r.memorialSlug,
    memorialName: r.memorialName,
    giver: r.displayName?.trim() || r.fullName?.trim() || null,
    providerRef: r.providerRef,
  };
}

const baseSelect = {
  id: orders.id,
  createdAt: orders.createdAt,
  status: orders.status,
  provider: orders.provider,
  kind: orders.kind,
  amountMinor: orders.amountMinor,
  feeMinor: orders.feeMinor,
  currency: orders.currency,
  memorialSlug: memorials.slug,
  memorialName: memorialNames.value,
  displayName: users.displayName,
  fullName: users.fullName,
  providerRef: orders.providerSessionId,
};

function paymentOrdersQuery() {
  return db()
    .select(baseSelect)
    .from(orders)
    .leftJoin(memorials, eq(memorials.id, orders.memorialId))
    .leftJoin(
      memorialNames,
      and(
        eq(memorialNames.memorialId, orders.memorialId),
        eq(memorialNames.type, "primary"),
      ),
    )
    .leftJoin(users, eq(users.id, orders.userId));
}

/** Recent payment orders plus all-time paid totals, for the admin ledger. */
export async function listAdminOrders(opts?: {
  limit?: number;
}): Promise<AdminOrdersResult> {
  const limit = Math.min(Math.max(opts?.limit ?? 200, 1), 1000);

  const rows = await paymentOrdersQuery()
    .where(inArray(orders.provider, [...PAYMENT_PROVIDERS]))
    .orderBy(desc(orders.createdAt))
    .limit(limit);

  const [agg] = await db()
    .select({
      count: sql<string>`count(*)`,
      gross: sql<string>`coalesce(sum(${orders.amountMinor}), 0)`,
      fee: sql<string>`coalesce(sum(coalesce(${orders.feeMinor}, round(${orders.amountMinor}::numeric * ${PLATFORM_FEE_RATE})::bigint)), 0)`,
    })
    .from(orders)
    .where(
      and(
        inArray(orders.provider, [...PAYMENT_PROVIDERS]),
        eq(orders.status, "paid"),
      ),
    );

  const grossMinor = Number(agg?.gross ?? 0);
  const feeMinor = Number(agg?.fee ?? 0);

  // Success / unfinished / failed, split apart so an operator sees each clearly.
  const statusRows = await db()
    .select({
      status: orders.status,
      count: sql<string>`count(*)`,
      gross: GROSS_SUM,
    })
    .from(orders)
    .where(inArray(orders.provider, [...PAYMENT_PROVIDERS]))
    .groupBy(orders.status);

  const byStatus = {
    paid: { count: 0, grossMinor: 0 },
    pending: { count: 0, grossMinor: 0 },
    failed: { count: 0, grossMinor: 0 },
  };
  for (const s of statusRows) {
    const bucket =
      s.status === "paid" ? "paid" : s.status === "pending" ? "pending" : "failed";
    byStatus[bucket].count += Number(s.count);
    byStatus[bucket].grossMinor += Number(s.gross);
  }

  return {
    rows: rows.map(toRow),
    totals: {
      count: Number(agg?.count ?? 0),
      grossMinor,
      feeMinor,
      netMinor: grossMinor - feeMinor,
    },
    byStatus,
  };
}

export interface AccountBalance {
  memorialSlug: string | null;
  memorialName: string | null;
  /** The family account that receives the gift-out, when one is set up. */
  beneficiaryName: string | null;
  orderCount: number;
  grossMinor: number;
  feeMinor: number;
  netMinor: number;
}

/**
 * Paid income aggregated per memorial (i.e. per family account): how much each
 * account has taken in, the platform fee, and the net owed to that family. This
 * is the "which account holds how much" view.
 */
export async function listAccountBalances(): Promise<AccountBalance[]> {
  const rows = await db()
    .select({
      slug: memorials.slug,
      name: memorialNames.value,
      beneficiary: memorialBeneficiaries.legalName,
      count: sql<string>`count(*)`,
      gross: GROSS_SUM,
      fee: FEE_SUM,
    })
    .from(orders)
    .leftJoin(memorials, eq(memorials.id, orders.memorialId))
    .leftJoin(
      memorialNames,
      and(
        eq(memorialNames.memorialId, orders.memorialId),
        eq(memorialNames.type, "primary"),
      ),
    )
    .leftJoin(
      memorialBeneficiaries,
      eq(memorialBeneficiaries.memorialId, orders.memorialId),
    )
    .where(
      and(
        inArray(orders.provider, [...PAYMENT_PROVIDERS]),
        eq(orders.status, "paid"),
      ),
    )
    .groupBy(
      orders.memorialId,
      memorials.slug,
      memorialNames.value,
      memorialBeneficiaries.legalName,
    )
    .orderBy(desc(GROSS_SUM));

  return rows.map((r) => {
    const gross = Number(r.gross);
    const fee = Number(r.fee);
    return {
      memorialSlug: r.slug,
      memorialName: r.name,
      beneficiaryName: r.beneficiary,
      orderCount: Number(r.count),
      grossMinor: gross,
      feeMinor: fee,
      netMinor: gross - fee,
    };
  });
}

/** All payment orders as CSV, for reconciliation against PayPal/Stripe. */
export async function adminOrdersCsv(): Promise<string> {
  const rows = await paymentOrdersQuery()
    .where(inArray(orders.provider, [...PAYMENT_PROVIDERS]))
    .orderBy(desc(orders.createdAt))
    .limit(10000);

  const header = [
    "created_at",
    "status",
    "provider",
    "kind",
    "memorial",
    "giver",
    "gross_cny",
    "fee_cny",
    "net_cny",
    "provider_ref",
  ];
  const esc = (v: string): string =>
    /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  const yuan = (minor: number): string => (minor / 100).toFixed(2);

  const lines = rows.map(toRow).map((r) =>
    [
      r.createdAt.toISOString(),
      r.status,
      r.provider ?? "",
      r.kind ?? "",
      r.memorialName ?? r.memorialSlug ?? "",
      r.giver ?? "",
      yuan(r.amountMinor),
      yuan(r.feeMinor),
      yuan(r.netMinor),
      r.providerRef ?? "",
    ]
      .map((c) => esc(String(c)))
      .join(","),
  );

  return [header.join(","), ...lines].join("\n");
}

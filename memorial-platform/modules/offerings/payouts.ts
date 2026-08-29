import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  memorialBeneficiaries,
  memorialNames,
  memorials,
  payoutRequests,
} from "@/db/schema";
import { deriveKey, seal, unseal } from "@/lib/crypto";
import { env } from "@/lib/env";
import { err, ok } from "@/lib/result";
import type { Result } from "@/lib/result";
import type { Actor } from "@/modules/permissions/types";
import { familyAccrual, PAYOUT_THRESHOLD_MINOR } from "./accrual";
import { PLATFORM_FEE_RATE } from "./catalog";

export type PayoutError =
  | "AUTH_REQUIRED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INVALID_INPUT"
  | "NO_BENEFICIARY"
  | "NOT_ACTIVE"
  | "BELOW_THRESHOLD"
  | "ALREADY_REQUESTED";

export type PayoutMethod = "bank" | "alipay" | "usdt";

/** Statuses that reserve funds (not yet released back to available). */
const RESERVING = ["requested", "approved", "processing", "paid"] as const;
const OPEN = ["requested", "approved", "processing"] as const;

function payoutKey(): Buffer {
  return deriveKey(env().SESSION_SECRET, "beneficiary-payout");
}

async function ownedMemorial(
  actor: Actor,
  memorialId: string,
): Promise<Result<{ id: string }, PayoutError>> {
  if (!actor.userId) return err("AUTH_REQUIRED");
  const [m] = await db()
    .select({ id: memorials.id, ownerUserId: memorials.ownerUserId })
    .from(memorials)
    .where(eq(memorials.id, memorialId));
  if (!m) return err("NOT_FOUND");
  if (m.ownerUserId !== actor.userId) return err("FORBIDDEN");
  return ok({ id: m.id });
}

export interface BeneficiaryView {
  id: string;
  status: "pending" | "active" | "suspended";
  legalName: string;
  method: PayoutMethod | null;
  /** Decrypted account, for the owner's own view. */
  account: string | null;
}

/** The beneficiary enrolled on a memorial, if any (account decrypted). */
export async function getBeneficiary(
  memorialId: string,
): Promise<BeneficiaryView | null> {
  const [row] = await db()
    .select({
      id: memorialBeneficiaries.id,
      status: memorialBeneficiaries.status,
      legalName: memorialBeneficiaries.legalName,
      method: memorialBeneficiaries.payoutMethodType,
      enc: memorialBeneficiaries.payoutDetailsEncrypted,
    })
    .from(memorialBeneficiaries)
    .where(eq(memorialBeneficiaries.memorialId, memorialId));
  if (!row) return null;
  return {
    id: row.id,
    status: row.status,
    legalName: row.legalName,
    method: (row.method as PayoutMethod | null) ?? null,
    account: row.enc ? unseal(payoutKey(), row.enc) : null,
  };
}

/** Owner enrols (or updates) the family payout recipient. Resets to pending. */
export async function enrolBeneficiary(
  actor: Actor,
  memorialId: string,
  input: { legalName: string; method: PayoutMethod; account: string },
): Promise<Result<{ id: string }, PayoutError>> {
  const owned = await ownedMemorial(actor, memorialId);
  if (!owned.ok) return owned;

  const legalName = input.legalName.trim();
  const account = input.account.trim();
  if (legalName.length < 2 || account.length < 4) return err("INVALID_INPUT");
  if (!["bank", "alipay", "usdt"].includes(input.method)) {
    return err("INVALID_INPUT");
  }

  const enc = seal(payoutKey(), account);
  const existing = await getBeneficiary(memorialId);

  if (existing) {
    await db()
      .update(memorialBeneficiaries)
      .set({
        userId: actor.userId!,
        legalName,
        payoutMethodType: input.method,
        payoutDetailsEncrypted: enc,
        status: "pending",
        updatedAt: sql`now()`,
      })
      .where(eq(memorialBeneficiaries.memorialId, memorialId));
    return ok({ id: existing.id });
  }

  const [row] = await db()
    .insert(memorialBeneficiaries)
    .values({
      memorialId,
      userId: actor.userId!,
      legalName,
      payoutMethodType: input.method,
      payoutDetailsEncrypted: enc,
      status: "pending",
    })
    .returning({ id: memorialBeneficiaries.id });
  return ok({ id: row!.id });
}

export interface PayoutStanding {
  grossMinor: number;
  reservedMinor: number;
  availableMinor: number;
  feeOnAvailableMinor: number;
  netOnAvailableMinor: number;
  thresholdMinor: number;
  canRequest: boolean;
}

/** How much of the accrual is still available to be gifted out. */
export async function payoutStanding(
  memorialId: string,
  beneficiaryId: string | null,
): Promise<PayoutStanding> {
  const accrual = await familyAccrual(memorialId);
  let reservedMinor = 0;
  if (beneficiaryId) {
    const [agg] = await db()
      .select({
        reserved: sql<string>`coalesce(sum(${payoutRequests.grossMinor}), 0)`,
      })
      .from(payoutRequests)
      .where(
        and(
          eq(payoutRequests.beneficiaryId, beneficiaryId),
          inArray(payoutRequests.status, [...RESERVING]),
        ),
      );
    reservedMinor = Number(agg?.reserved ?? 0);
  }
  const availableMinor = Math.max(0, accrual.grossMinor - reservedMinor);
  const feeOnAvailableMinor = Math.round(availableMinor * PLATFORM_FEE_RATE);
  return {
    grossMinor: accrual.grossMinor,
    reservedMinor,
    availableMinor,
    feeOnAvailableMinor,
    netOnAvailableMinor: availableMinor - feeOnAvailableMinor,
    thresholdMinor: PAYOUT_THRESHOLD_MINOR,
    canRequest: availableMinor >= PAYOUT_THRESHOLD_MINOR,
  };
}

/** Owner requests a gift-out of everything currently available. */
export async function requestPayout(
  actor: Actor,
  memorialId: string,
): Promise<Result<{ id: string }, PayoutError>> {
  const owned = await ownedMemorial(actor, memorialId);
  if (!owned.ok) return owned;

  const beneficiary = await getBeneficiary(memorialId);
  if (!beneficiary) return err("NO_BENEFICIARY");
  if (beneficiary.status !== "active") return err("NOT_ACTIVE");

  const open = await db()
    .select({ id: payoutRequests.id })
    .from(payoutRequests)
    .where(
      and(
        eq(payoutRequests.beneficiaryId, beneficiary.id),
        inArray(payoutRequests.status, [...OPEN]),
      ),
    );
  if (open.length > 0) return err("ALREADY_REQUESTED");

  const standing = await payoutStanding(memorialId, beneficiary.id);
  if (!standing.canRequest) return err("BELOW_THRESHOLD");

  const grossMinor = standing.availableMinor;
  const platformFeeMinor = Math.round(grossMinor * PLATFORM_FEE_RATE);
  const netMinor = grossMinor - platformFeeMinor;

  const [row] = await db()
    .insert(payoutRequests)
    .values({
      beneficiaryId: beneficiary.id,
      currency: "CNY",
      pointsAmount: grossMinor,
      grossMinor,
      platformFeeMinor,
      transferCostMinor: 0,
      netMinor,
      method: beneficiary.method ?? "alipay",
      status: "requested",
    })
    .returning({ id: payoutRequests.id });
  return ok({ id: row!.id });
}

export interface OwnerPayoutRow {
  id: string;
  status: string;
  grossMinor: number;
  platformFeeMinor: number;
  netMinor: number;
  method: string;
  requestedAt: Date;
  resolvedAt: Date | null;
}

/** A memorial's own payout request history, for the owner's manage page. */
export async function listOwnerPayouts(
  beneficiaryId: string,
): Promise<OwnerPayoutRow[]> {
  const rows = await db()
    .select({
      id: payoutRequests.id,
      status: payoutRequests.status,
      grossMinor: payoutRequests.grossMinor,
      platformFeeMinor: payoutRequests.platformFeeMinor,
      netMinor: payoutRequests.netMinor,
      method: payoutRequests.method,
      requestedAt: payoutRequests.requestedAt,
      resolvedAt: payoutRequests.resolvedAt,
    })
    .from(payoutRequests)
    .where(eq(payoutRequests.beneficiaryId, beneficiaryId))
    .orderBy(desc(payoutRequests.requestedAt))
    .limit(50);
  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    grossMinor: Number(r.grossMinor),
    platformFeeMinor: Number(r.platformFeeMinor),
    netMinor: Number(r.netMinor),
    method: r.method,
    requestedAt: r.requestedAt,
    resolvedAt: r.resolvedAt,
  }));
}

/* ─────────────── Admin side ─────────────── */

export interface AdminPayoutRow {
  id: string;
  status: string;
  memorialName: string | null;
  legalName: string;
  method: string;
  account: string | null;
  grossMinor: number;
  platformFeeMinor: number;
  netMinor: number;
  requestedAt: Date;
  note: string | null;
  providerRef: string | null;
}

/** Payout requests for the admin queue (accounts decrypted so staff can pay). */
export async function listAdminPayouts(opts?: {
  openOnly?: boolean;
}): Promise<AdminPayoutRow[]> {
  const rows = await db()
    .select({
      id: payoutRequests.id,
      status: payoutRequests.status,
      grossMinor: payoutRequests.grossMinor,
      platformFeeMinor: payoutRequests.platformFeeMinor,
      netMinor: payoutRequests.netMinor,
      method: payoutRequests.method,
      requestedAt: payoutRequests.requestedAt,
      note: payoutRequests.note,
      providerRef: payoutRequests.providerRef,
      legalName: memorialBeneficiaries.legalName,
      enc: memorialBeneficiaries.payoutDetailsEncrypted,
      memorialId: memorialBeneficiaries.memorialId,
      memorialName: memorialNames.value,
    })
    .from(payoutRequests)
    .innerJoin(
      memorialBeneficiaries,
      eq(memorialBeneficiaries.id, payoutRequests.beneficiaryId),
    )
    .leftJoin(
      memorialNames,
      and(
        eq(memorialNames.memorialId, memorialBeneficiaries.memorialId),
        eq(memorialNames.type, "primary"),
      ),
    )
    .where(opts?.openOnly ? inArray(payoutRequests.status, [...OPEN]) : undefined)
    .orderBy(desc(payoutRequests.requestedAt))
    .limit(200);

  const key = payoutKey();
  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    memorialName: r.memorialName,
    legalName: r.legalName,
    method: r.method,
    account: r.enc ? unseal(key, r.enc) : null,
    grossMinor: Number(r.grossMinor),
    platformFeeMinor: Number(r.platformFeeMinor),
    netMinor: Number(r.netMinor),
    requestedAt: r.requestedAt,
    note: r.note,
    providerRef: r.providerRef,
  }));
}

/** Admin marks a request paid or rejected. */
export async function decidePayout(
  actor: Actor,
  payoutId: string,
  decision: "paid" | "rejected",
  note: string | null,
  providerRef: string | null,
): Promise<Result<{ status: string }, PayoutError>> {
  if (!actor.userId) return err("AUTH_REQUIRED");
  const claimed = await db()
    .update(payoutRequests)
    .set({
      status: decision,
      adminUserId: actor.userId,
      note: note ?? null,
      providerRef: providerRef ?? null,
      resolvedAt: sql`now()`,
    })
    .where(
      and(
        eq(payoutRequests.id, payoutId),
        inArray(payoutRequests.status, [...OPEN]),
      ),
    )
    .returning({ id: payoutRequests.id });
  if (!claimed[0]) return err("NOT_FOUND");
  return ok({ status: decision });
}

/** Admin activates or suspends a beneficiary (identity review). */
export async function setBeneficiaryStatus(
  actor: Actor,
  beneficiaryId: string,
  status: "active" | "suspended" | "pending",
): Promise<Result<{ status: string }, PayoutError>> {
  if (!actor.userId) return err("AUTH_REQUIRED");
  const claimed = await db()
    .update(memorialBeneficiaries)
    .set({ status, updatedAt: sql`now()` })
    .where(eq(memorialBeneficiaries.id, beneficiaryId))
    .returning({ id: memorialBeneficiaries.id });
  if (!claimed[0]) return err("NOT_FOUND");
  return ok({ status });
}

export interface AdminBeneficiaryRow {
  id: string;
  status: string;
  legalName: string;
  method: string | null;
  account: string | null;
  memorialName: string | null;
}

/** Beneficiaries awaiting identity review (pending), for the admin queue. */
export async function listPendingBeneficiaries(): Promise<AdminBeneficiaryRow[]> {
  const rows = await db()
    .select({
      id: memorialBeneficiaries.id,
      status: memorialBeneficiaries.status,
      legalName: memorialBeneficiaries.legalName,
      method: memorialBeneficiaries.payoutMethodType,
      enc: memorialBeneficiaries.payoutDetailsEncrypted,
      memorialName: memorialNames.value,
    })
    .from(memorialBeneficiaries)
    .leftJoin(
      memorialNames,
      and(
        eq(memorialNames.memorialId, memorialBeneficiaries.memorialId),
        eq(memorialNames.type, "primary"),
      ),
    )
    .where(eq(memorialBeneficiaries.status, "pending"))
    .orderBy(desc(memorialBeneficiaries.createdAt))
    .limit(100);

  const key = payoutKey();
  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    legalName: r.legalName,
    method: (r.method as string | null) ?? null,
    account: r.enc ? unseal(key, r.enc) : null,
    memorialName: r.memorialName,
  }));
}

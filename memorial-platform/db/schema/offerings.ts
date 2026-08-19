import {
  bigint,
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./identity";
import { memorials } from "./memorial";
import { orders } from "./commerce";

export const offeringCategory = pgEnum("offering_category", [
  "incense",
  "candle",
  "flower",
  "paper_money",
  "gold_ingot",
  "wreath",
  "custom",
]);

export const offeringStatus = pgEnum("offering_status", [
  "active",
  "expired",
  "refunded",
]);

export const beneficiaryStatus = pgEnum("beneficiary_status", [
  "pending",
  "active",
  "suspended",
]);

export const payoutMethod = pgEnum("payout_method", [
  "bank",
  "alipay",
  "usdt",
]);

export const payoutRequestStatus = pgEnum("payout_request_status", [
  "requested",
  "approved",
  "processing",
  "paid",
  "rejected",
  "failed",
]);

export const ledgerEntryType = pgEnum("ledger_entry_type", [
  "credit_offering",
  "debit_payout",
  "reversal_refund",
  "reversal_chargeback",
  "adjustment",
]);

export const offeringProducts = pgTable(
  "offering_products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    category: offeringCategory("category").notNull(),
    priceMinor: bigint("price_minor", { mode: "number" }),
    currency: text("currency"),
    points: integer("points").notNull().default(0),
    displayDurationHours: integer("display_duration_hours"),
    maxPerSession: integer("max_per_session"),
    assetKey: text("asset_key"),
    animationKey: text("animation_key"),
    isActive: boolean("is_active").default(true).notNull(),
    sortWeight: integer("sort_weight").default(0).notNull(),
    locales: text("locales").array().default([]).notNull(),
    traditions: text("traditions").array().default([]).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("offering_products_slug_key").on(table.slug)],
);

export const offeringProductTranslations = pgTable(
  "offering_product_translations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => offeringProducts.id, { onDelete: "cascade" }),
    locale: text("locale").notNull(),
    name: text("name").notNull(),
    description: text("description"),
  },
  (table) => [
    uniqueIndex("offering_product_translations_product_locale_key").on(
      table.productId,
      table.locale,
    ),
  ],
);

export const offeringProductPrices = pgTable(
  "offering_product_prices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => offeringProducts.id, { onDelete: "cascade" }),
    currency: text("currency").notNull(),
    priceMinor: bigint("price_minor", { mode: "number" }).notNull(),
  },
  (table) => [
    uniqueIndex("offering_product_prices_product_currency_key").on(
      table.productId,
      table.currency,
    ),
  ],
);

export const memorialOfferings = pgTable(
  "memorial_offerings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    memorialId: uuid("memorial_id")
      .notNull()
      .references(() => memorials.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => offeringProducts.id, { onDelete: "restrict" }),
    giverUserId: uuid("giver_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    giverDisplayName: text("giver_display_name"),
    message: text("message"),
    quantity: integer("quantity").default(1).notNull(),
    amountMinor: bigint("amount_minor", { mode: "number" }),
    currency: text("currency"),
    pointsAwarded: integer("points_awarded").default(0).notNull(),
    orderId: uuid("order_id").references(() => orders.id, {
      onDelete: "set null",
    }),
    status: offeringStatus("status").default("active").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("memorial_offerings_memorial_idx").on(table.memorialId),
    index("memorial_offerings_giver_idx").on(table.giverUserId),
  ],
);

export const memorialBeneficiaries = pgTable(
  "memorial_beneficiaries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    memorialId: uuid("memorial_id")
      .notNull()
      .references(() => memorials.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    legalName: text("legal_name").notNull(),
    status: beneficiaryStatus("status").default("pending").notNull(),
    payoutMethodType: payoutMethod("payout_method_type"),
    payoutDetailsEncrypted: text("payout_details_encrypted"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("memorial_beneficiaries_memorial_key").on(table.memorialId),
    index("memorial_beneficiaries_user_idx").on(table.userId),
  ],
);

export const beneficiaryLedger = pgTable(
  "beneficiary_ledger",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    beneficiaryId: uuid("beneficiary_id")
      .notNull()
      .references(() => memorialBeneficiaries.id, { onDelete: "restrict" }),
    entryType: ledgerEntryType("entry_type").notNull(),
    currency: text("currency").notNull(),
    pointsDelta: integer("points_delta").notNull(),
    balanceAfter: integer("balance_after").notNull(),
    sourceType: text("source_type"),
    sourceId: uuid("source_id"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("beneficiary_ledger_beneficiary_idx").on(table.beneficiaryId),
  ],
);

export const payoutRequests = pgTable(
  "payout_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    beneficiaryId: uuid("beneficiary_id")
      .notNull()
      .references(() => memorialBeneficiaries.id, { onDelete: "restrict" }),
    currency: text("currency").notNull(),
    pointsAmount: integer("points_amount").notNull(),
    grossMinor: bigint("gross_minor", { mode: "number" }).notNull(),
    platformFeeMinor: bigint("platform_fee_minor", { mode: "number" }).notNull(),
    transferCostMinor: bigint("transfer_cost_minor", { mode: "number" }).notNull(),
    netMinor: bigint("net_minor", { mode: "number" }).notNull(),
    method: payoutMethod("method").notNull(),
    status: payoutRequestStatus("status").default("requested").notNull(),
    adminUserId: uuid("admin_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    note: text("note"),
    providerRef: text("provider_ref"),
    requestedAt: timestamp("requested_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (table) => [
    index("payout_requests_beneficiary_idx").on(table.beneficiaryId),
    index("payout_requests_status_idx").on(table.status),
  ],
);

export type OfferingProduct = typeof offeringProducts.$inferSelect;
export type OfferingProductTranslation =
  typeof offeringProductTranslations.$inferSelect;
export type OfferingProductPrice = typeof offeringProductPrices.$inferSelect;
export type MemorialOffering = typeof memorialOfferings.$inferSelect;
export type MemorialBeneficiary = typeof memorialBeneficiaries.$inferSelect;
export type BeneficiaryLedgerEntry = typeof beneficiaryLedger.$inferSelect;
export type PayoutRequest = typeof payoutRequests.$inferSelect;

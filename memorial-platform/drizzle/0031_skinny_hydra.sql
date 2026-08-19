CREATE TYPE "public"."beneficiary_status" AS ENUM('pending', 'active', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."ledger_entry_type" AS ENUM('credit_offering', 'debit_payout', 'reversal_refund', 'reversal_chargeback', 'adjustment');--> statement-breakpoint
CREATE TYPE "public"."offering_category" AS ENUM('incense', 'candle', 'flower', 'paper_money', 'gold_ingot', 'wreath', 'custom');--> statement-breakpoint
CREATE TYPE "public"."offering_status" AS ENUM('active', 'expired', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."payout_method" AS ENUM('bank', 'alipay', 'usdt');--> statement-breakpoint
CREATE TYPE "public"."payout_request_status" AS ENUM('requested', 'approved', 'processing', 'paid', 'rejected', 'failed');--> statement-breakpoint
CREATE TABLE "beneficiary_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"beneficiary_id" uuid NOT NULL,
	"entry_type" "ledger_entry_type" NOT NULL,
	"currency" text NOT NULL,
	"points_delta" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"source_type" text,
	"source_id" uuid,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memorial_beneficiaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"memorial_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"legal_name" text NOT NULL,
	"status" "beneficiary_status" DEFAULT 'pending' NOT NULL,
	"payout_method_type" "payout_method",
	"payout_details_encrypted" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memorial_offerings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"memorial_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"giver_user_id" uuid,
	"giver_display_name" text,
	"message" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"amount_minor" bigint,
	"currency" text,
	"points_awarded" integer DEFAULT 0 NOT NULL,
	"order_id" uuid,
	"status" "offering_status" DEFAULT 'active' NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offering_product_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"currency" text NOT NULL,
	"price_minor" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offering_product_translations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "offering_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"category" "offering_category" NOT NULL,
	"price_minor" bigint,
	"currency" text,
	"points" integer DEFAULT 0 NOT NULL,
	"display_duration_hours" integer,
	"max_per_session" integer,
	"asset_key" text,
	"animation_key" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_weight" integer DEFAULT 0 NOT NULL,
	"locales" text[] DEFAULT '{}' NOT NULL,
	"traditions" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payout_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"beneficiary_id" uuid NOT NULL,
	"currency" text NOT NULL,
	"points_amount" integer NOT NULL,
	"gross_minor" bigint NOT NULL,
	"platform_fee_minor" bigint NOT NULL,
	"transfer_cost_minor" bigint NOT NULL,
	"net_minor" bigint NOT NULL,
	"method" "payout_method" NOT NULL,
	"status" "payout_request_status" DEFAULT 'requested' NOT NULL,
	"admin_user_id" uuid,
	"note" text,
	"provider_ref" text,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "kind" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "memorial_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "provider" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "provider_session_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "fee_minor" bigint;--> statement-breakpoint
ALTER TABLE "beneficiary_ledger" ADD CONSTRAINT "beneficiary_ledger_beneficiary_id_memorial_beneficiaries_id_fk" FOREIGN KEY ("beneficiary_id") REFERENCES "public"."memorial_beneficiaries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memorial_beneficiaries" ADD CONSTRAINT "memorial_beneficiaries_memorial_id_memorials_id_fk" FOREIGN KEY ("memorial_id") REFERENCES "public"."memorials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memorial_beneficiaries" ADD CONSTRAINT "memorial_beneficiaries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memorial_offerings" ADD CONSTRAINT "memorial_offerings_memorial_id_memorials_id_fk" FOREIGN KEY ("memorial_id") REFERENCES "public"."memorials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memorial_offerings" ADD CONSTRAINT "memorial_offerings_product_id_offering_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."offering_products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memorial_offerings" ADD CONSTRAINT "memorial_offerings_giver_user_id_users_id_fk" FOREIGN KEY ("giver_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memorial_offerings" ADD CONSTRAINT "memorial_offerings_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offering_product_prices" ADD CONSTRAINT "offering_product_prices_product_id_offering_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."offering_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offering_product_translations" ADD CONSTRAINT "offering_product_translations_product_id_offering_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."offering_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_beneficiary_id_memorial_beneficiaries_id_fk" FOREIGN KEY ("beneficiary_id") REFERENCES "public"."memorial_beneficiaries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_admin_user_id_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "beneficiary_ledger_beneficiary_idx" ON "beneficiary_ledger" USING btree ("beneficiary_id");--> statement-breakpoint
CREATE UNIQUE INDEX "memorial_beneficiaries_memorial_key" ON "memorial_beneficiaries" USING btree ("memorial_id");--> statement-breakpoint
CREATE INDEX "memorial_beneficiaries_user_idx" ON "memorial_beneficiaries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "memorial_offerings_memorial_idx" ON "memorial_offerings" USING btree ("memorial_id");--> statement-breakpoint
CREATE INDEX "memorial_offerings_giver_idx" ON "memorial_offerings" USING btree ("giver_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "offering_product_prices_product_currency_key" ON "offering_product_prices" USING btree ("product_id","currency");--> statement-breakpoint
CREATE UNIQUE INDEX "offering_product_translations_product_locale_key" ON "offering_product_translations" USING btree ("product_id","locale");--> statement-breakpoint
CREATE UNIQUE INDEX "offering_products_slug_key" ON "offering_products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "payout_requests_beneficiary_idx" ON "payout_requests" USING btree ("beneficiary_id");--> statement-breakpoint
CREATE INDEX "payout_requests_status_idx" ON "payout_requests" USING btree ("status");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_memorial_id_memorials_id_fk" FOREIGN KEY ("memorial_id") REFERENCES "public"."memorials"("id") ON DELETE set null ON UPDATE no action;
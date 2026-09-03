CREATE TABLE "memorial_followers" (
	"memorial_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memorial_followers_memorial_id_user_id_pk" PRIMARY KEY("memorial_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "reminder_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_user_id" uuid NOT NULL,
	"occasion" text NOT NULL,
	"occasion_date" date NOT NULL,
	"offset_days" integer NOT NULL,
	"memorial_id" uuid,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_reminders_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "memorial_followers" ADD CONSTRAINT "memorial_followers_memorial_id_memorials_id_fk" FOREIGN KEY ("memorial_id") REFERENCES "public"."memorials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memorial_followers" ADD CONSTRAINT "memorial_followers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_deliveries" ADD CONSTRAINT "reminder_deliveries_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_deliveries" ADD CONSTRAINT "reminder_deliveries_memorial_id_memorials_id_fk" FOREIGN KEY ("memorial_id") REFERENCES "public"."memorials"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "memorial_followers_user_idx" ON "memorial_followers" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reminder_deliveries_once_key" ON "reminder_deliveries" USING btree ("recipient_user_id","occasion","occasion_date","offset_days");
CREATE TABLE "memorial_contact_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"memorial_id" uuid NOT NULL,
	"sender_user_id" uuid,
	"sender_name" text,
	"sender_contact" text,
	"body" text NOT NULL,
	"sender_ip_hash" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "memorial_contact_messages" ADD CONSTRAINT "memorial_contact_messages_memorial_id_memorials_id_fk" FOREIGN KEY ("memorial_id") REFERENCES "public"."memorials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memorial_contact_messages" ADD CONSTRAINT "memorial_contact_messages_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "memorial_contact_messages_idx" ON "memorial_contact_messages" USING btree ("memorial_id","read_at");
CREATE TYPE "public"."takeover_status" AS ENUM('pending', 'accepted', 'declined', 'escalated', 'withdrawn');--> statement-breakpoint
CREATE TABLE "memorial_takeover_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"memorial_id" uuid NOT NULL,
	"requester_user_id" uuid NOT NULL,
	"relationship" "relationship_kind" NOT NULL,
	"reason" text NOT NULL,
	"status" "takeover_status" DEFAULT 'pending' NOT NULL,
	"responded_by_user_id" uuid,
	"responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "memorial_takeover_requests" ADD CONSTRAINT "memorial_takeover_requests_memorial_id_memorials_id_fk" FOREIGN KEY ("memorial_id") REFERENCES "public"."memorials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memorial_takeover_requests" ADD CONSTRAINT "memorial_takeover_requests_requester_user_id_users_id_fk" FOREIGN KEY ("requester_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memorial_takeover_requests" ADD CONSTRAINT "memorial_takeover_requests_responded_by_user_id_users_id_fk" FOREIGN KEY ("responded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "memorial_takeover_requester_key" ON "memorial_takeover_requests" USING btree ("memorial_id","requester_user_id");--> statement-breakpoint
CREATE INDEX "memorial_takeover_memorial_idx" ON "memorial_takeover_requests" USING btree ("memorial_id");
CREATE TYPE "public"."tribute_type" AS ENUM('candle', 'flower');--> statement-breakpoint
CREATE TABLE "memorial_tributes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"memorial_id" uuid NOT NULL,
	"type" "tribute_type" NOT NULL,
	"actor_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "memorial_tributes" ADD CONSTRAINT "memorial_tributes_memorial_id_memorials_id_fk" FOREIGN KEY ("memorial_id") REFERENCES "public"."memorials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memorial_tributes" ADD CONSTRAINT "memorial_tributes_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "memorial_tributes_memorial_idx" ON "memorial_tributes" USING btree ("memorial_id","type");
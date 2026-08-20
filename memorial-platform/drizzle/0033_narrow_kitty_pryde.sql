ALTER TABLE "visitor_submissions" ADD COLUMN "is_contribution" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "visitor_submissions" ADD COLUMN "contributor_name" text;--> statement-breakpoint
ALTER TABLE "visitor_submissions" ADD COLUMN "contributor_relation" text;--> statement-breakpoint
ALTER TABLE "visitor_submissions" ADD COLUMN "chapter_id" uuid;--> statement-breakpoint
ALTER TABLE "visitor_submissions" ADD COLUMN "contributor_ip_hash" text;--> statement-breakpoint
ALTER TABLE "visitor_submissions" ADD CONSTRAINT "visitor_submissions_chapter_id_life_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."life_chapters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "visitor_submissions_contribution_idx" ON "visitor_submissions" USING btree ("memorial_id","is_contribution","status");
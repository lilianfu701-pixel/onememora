ALTER TYPE "public"."content_type" ADD VALUE IF NOT EXISTS 'life_chapter';--> statement-breakpoint
CREATE TABLE "content_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_type" text NOT NULL,
	"owner_id" uuid NOT NULL,
	"media_id" uuid NOT NULL,
	"role" text DEFAULT 'gallery' NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"caption" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "life_chapters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"memorial_id" uuid NOT NULL,
	"chapter_key" text NOT NULL,
	"custom_title" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"published_version_id" uuid,
	"latest_version" integer DEFAULT 0 NOT NULL,
	"cover_media_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "content_media" ADD CONSTRAINT "content_media_media_id_media_assets_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "life_chapters" ADD CONSTRAINT "life_chapters_memorial_id_memorials_id_fk" FOREIGN KEY ("memorial_id") REFERENCES "public"."memorials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "life_chapters" ADD CONSTRAINT "life_chapters_published_version_id_content_versions_id_fk" FOREIGN KEY ("published_version_id") REFERENCES "public"."content_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "life_chapters" ADD CONSTRAINT "life_chapters_cover_media_id_media_assets_id_fk" FOREIGN KEY ("cover_media_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "content_media_owner_idx" ON "content_media" USING btree ("owner_type","owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "content_media_owner_media_key" ON "content_media" USING btree ("owner_type","owner_id","media_id");--> statement-breakpoint
CREATE INDEX "life_chapters_memorial_idx" ON "life_chapters" USING btree ("memorial_id","display_order");
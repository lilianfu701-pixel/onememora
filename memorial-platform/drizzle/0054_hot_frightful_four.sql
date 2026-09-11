ALTER TABLE "memorials" ADD COLUMN "regions" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "memorials" ADD COLUMN "homepage_display" boolean DEFAULT true NOT NULL;--> statement-breakpoint
-- Backfill existing memorials into all three Chinese channels, preserving the
-- findability they had before search became channel-scoped. New memorials get
-- their creator's channel(s) from the application layer.
UPDATE "memorials" SET "regions" = ARRAY['zh-CN','zh-TW','zh-HK']::text[] WHERE "regions" = '{}'::text[];
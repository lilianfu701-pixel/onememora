ALTER TABLE "media_assets" ALTER COLUMN "memorial_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_media_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "show_avatar_in_tree" boolean DEFAULT false NOT NULL;
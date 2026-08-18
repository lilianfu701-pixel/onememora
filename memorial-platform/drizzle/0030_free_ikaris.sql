ALTER TABLE "users" ADD COLUMN "name_visibility" text;--> statement-breakpoint
ALTER TABLE "memorial_relatives" ADD COLUMN "name_visibility" text DEFAULT 'family' NOT NULL;--> statement-breakpoint
-- Carry the old boolean forward: names that were public, and the deceased,
-- stay public; living relatives that were masked become family-visible.
UPDATE "memorial_relatives" SET "name_visibility" = 'public' WHERE "show_full_name" = true OR "is_deceased" = true;
ALTER TABLE "memorials" ADD COLUMN "stewarded_by_admin_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "memorials" ADD COLUMN "offerings_disabled" jsonb DEFAULT '[]'::jsonb NOT NULL;
CREATE TYPE "public"."takeover_kind" AS ENUM('takeover', 'join');--> statement-breakpoint
ALTER TABLE "memorial_takeover_requests" ADD COLUMN "kind" "takeover_kind" DEFAULT 'takeover' NOT NULL;
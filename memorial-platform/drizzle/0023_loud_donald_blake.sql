ALTER TYPE "public"."relationship_kind" ADD VALUE 'paternal_grandfather' BEFORE 'son';--> statement-breakpoint
ALTER TYPE "public"."relationship_kind" ADD VALUE 'paternal_grandmother' BEFORE 'son';--> statement-breakpoint
ALTER TYPE "public"."relationship_kind" ADD VALUE 'maternal_grandfather' BEFORE 'son';--> statement-breakpoint
ALTER TYPE "public"."relationship_kind" ADD VALUE 'maternal_grandmother' BEFORE 'son';
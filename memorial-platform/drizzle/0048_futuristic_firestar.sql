ALTER TABLE "messages" ADD COLUMN "template_key" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "template_params" jsonb;
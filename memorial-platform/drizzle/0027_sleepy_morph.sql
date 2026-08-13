CREATE TABLE "memorial_bookmarks" (
	"user_id" uuid NOT NULL,
	"memorial_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memorial_bookmarks_user_id_memorial_id_pk" PRIMARY KEY("user_id","memorial_id")
);
--> statement-breakpoint
ALTER TABLE "memorial_bookmarks" ADD CONSTRAINT "memorial_bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memorial_bookmarks" ADD CONSTRAINT "memorial_bookmarks_memorial_id_memorials_id_fk" FOREIGN KEY ("memorial_id") REFERENCES "public"."memorials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "memorial_bookmarks_user_idx" ON "memorial_bookmarks" USING btree ("user_id");
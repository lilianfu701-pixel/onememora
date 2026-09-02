ALTER TABLE "memorials" ADD COLUMN "public_number" text;--> statement-breakpoint
DO $$
DECLARE
  r RECORD;
  cand text;
  done boolean;
BEGIN
  FOR r IN SELECT id FROM memorials WHERE public_number IS NULL LOOP
    done := false;
    WHILE NOT done LOOP
      cand := (10000000 + floor(random() * 90000000))::bigint::text;
      IF NOT EXISTS (SELECT 1 FROM memorials WHERE public_number = cand) THEN
        UPDATE memorials SET public_number = cand WHERE id = r.id;
        done := true;
      END IF;
    END LOOP;
  END LOOP;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX "memorials_public_number_key" ON "memorials" USING btree ("public_number");

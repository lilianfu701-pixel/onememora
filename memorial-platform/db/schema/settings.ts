import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Small key/value store for platform settings an admin can change at runtime,
 * without a redeploy — e.g. the CNY↔USD rates. Values are plain strings; the
 * reader parses and falls back to the env default when a key is absent.
 */
export const platformSettings = pgTable("platform_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type PlatformSetting = typeof platformSettings.$inferSelect;

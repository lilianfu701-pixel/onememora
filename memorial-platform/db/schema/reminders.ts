import {
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./identity";
import { memorials } from "./memorial";

/**
 * A signed-in visitor who wants to be reminded about a memorial (a friend, a
 * distant relative). The family (owner + members) are reminded regardless; this
 * is how everyone else opts in. Unfollowing is the unsubscribe.
 */
export const memorialFollowers = pgTable(
  "memorial_followers",
  {
    memorialId: uuid("memorial_id")
      .notNull()
      .references(() => memorials.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.memorialId, table.userId] }),
    index("memorial_followers_user_idx").on(table.userId),
  ],
);

/**
 * One row per reminder email actually sent, so a daily sweep is idempotent: it
 * never mails the same person about the same occasion, date and lead-time twice,
 * however many times it runs. `memorialId` is null for a shared festival
 * (Qingming, Zhongyuan) that is not tied to one memorial.
 */
export const reminderDeliveries = pgTable(
  "reminder_deliveries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recipientUserId: uuid("recipient_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** e.g. "death:<memorialId>", "qingming", "zhongyuan". */
    occasion: text("occasion").notNull(),
    /** The occasion's date this year (YYYY-MM-DD). */
    occasionDate: date("occasion_date").notNull(),
    /** How many days before the occasion this mail went (3 or 0). */
    offsetDays: integer("offset_days").notNull(),
    memorialId: uuid("memorial_id").references(() => memorials.id, {
      onDelete: "set null",
    }),
    sentAt: timestamp("sent_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("reminder_deliveries_once_key").on(
      table.recipientUserId,
      table.occasion,
      table.occasionDate,
      table.offsetDays,
    ),
  ],
);

export type MemorialFollower = typeof memorialFollowers.$inferSelect;
export type ReminderDelivery = typeof reminderDeliveries.$inferSelect;

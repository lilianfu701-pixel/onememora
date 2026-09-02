import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./identity";
import { memorials } from "./memorial";

/**
 * A person's inbox.
 *
 * Every message belongs to one recipient. A message with no sender is a system
 * message from the platform; a message with a sender is a personal message
 * from another account. `memorialId` is the memorial it concerns, when there is
 * one, so a reply can carry the same context. A reply is simply a new message
 * back to the sender — there is no separate thread table.
 */
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recipientUserId: uuid("recipient_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Null for a system message; otherwise the account that wrote it. */
    senderUserId: uuid("sender_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    /** The memorial this message is about, when it has a context. */
    memorialId: uuid("memorial_id").references(() => memorials.id, {
      onDelete: "set null",
    }),
    subject: text("subject"),
    /**
     * The message body. For a personal message this is the text the sender
     * wrote. For a system message it is a Chinese fallback — the recipient sees
     * the localized version rendered from `templateKey` when one is set.
     */
    body: text("body").notNull(),
    /**
     * A system message's translation key (in the `sysmsg` i18n namespace) and
     * its parameters. The inbox renders the body from these in the recipient's
     * language; null for a personal message, whose body is free text.
     */
    templateKey: text("template_key"),
    templateParams: jsonb("template_params").$type<Record<string, string>>(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("messages_recipient_idx").on(
      table.recipientUserId,
      table.readAt,
      table.createdAt,
    ),
  ],
);

export type Message = typeof messages.$inferSelect;

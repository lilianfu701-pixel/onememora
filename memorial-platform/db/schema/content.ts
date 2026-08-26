import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./identity";
import { mediaAssets } from "./media";
import { datePrecision, memorials } from "./memorial";

export const contentType = pgEnum("content_type", [
  "biography",
  "timeline_event",
  "tribute",
  "life_chapter",
]);

export const contentStatus = pgEnum("content_status", [
  "draft",
  "pending_review",
  "published",
  "rejected",
  "hidden",
]);

export const translationMethod = pgEnum("translation_method", [
  "human",
  "machine",
]);

export const translationStatus = pgEnum("translation_status", [
  "draft",
  "in_review",
  "published",
  "retired",
]);

export const submissionKind = pgEnum("submission_kind", ["story", "photo"]);

/**
 * Who a visitor's guestbook message is for:
 * - `public`  — everyone who can see the memorial
 * - `family`  — only members of this memorial
 * - `private` — only the author (kept between them and the deceased)
 */
export const visitorMessageAudience = pgEnum("visitor_message_audience", [
  "public",
  "family",
  "private",
]);

/**
 * The immutable record of what was written, and by whom.
 *
 * Rows here are never updated. An edit appends a new version and moves the
 * pointer on the owning item. A family's account of a life is exactly the kind
 * of record where "who changed this, and what did it say before" has to be
 * answerable years later, including during an ownership dispute.
 */
export const contentVersions = pgTable(
  "content_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contentType: contentType("content_type").notNull(),
    contentId: uuid("content_id").notNull(),
    version: integer("version").notNull(),
    title: text("title"),
    body: text("body").notNull(),
    /** The language it was written in. Never rewritten by a translation. */
    sourceLocale: text("source_locale").notNull(),
    authorUserId: uuid("author_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("content_versions_item_version_key").on(
      table.contentType,
      table.contentId,
      table.version,
    ),
    index("content_versions_item_idx").on(table.contentType, table.contentId),
  ],
);

/**
 * A translation of one version into one language.
 *
 * Attached to a version rather than to the item, so a translation can never be
 * mistaken for the original and never survives silently onto text it was not
 * made from. A machine translation is labelled as such and may not reach
 * `published` without a named reviewer. See doc 03 section 4.
 */
export const contentTranslations = pgTable(
  "content_translations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contentVersionId: uuid("content_version_id")
      .notNull()
      .references(() => contentVersions.id, { onDelete: "cascade" }),
    targetLocale: text("target_locale").notNull(),
    title: text("title"),
    body: text("body").notNull(),
    method: translationMethod("method").notNull(),
    status: translationStatus("status").default("draft").notNull(),
    reviewerUserId: uuid("reviewer_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("content_translations_version_locale_key").on(
      table.contentVersionId,
      table.targetLocale,
    ),
  ],
);

/** One life story per memorial. */
export const biographies = pgTable(
  "biographies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    memorialId: uuid("memorial_id")
      .notNull()
      .references(() => memorials.id, { onDelete: "cascade" }),
    status: contentStatus("status").default("draft").notNull(),
    /** The version the public sees. Null until the family publishes one. */
    publishedVersionId: uuid("published_version_id").references(
      () => contentVersions.id,
      { onDelete: "set null" },
    ),
    latestVersion: integer("latest_version").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("biographies_memorial_key").on(table.memorialId)],
);

export const timelineEvents = pgTable(
  "timeline_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    memorialId: uuid("memorial_id")
      .notNull()
      .references(() => memorials.id, { onDelete: "cascade" }),
    occurredOn: date("occurred_on", { mode: "string" }),
    occurredPrecision: datePrecision("occurred_precision")
      .default("unknown")
      .notNull(),
    status: contentStatus("status").default("draft").notNull(),
    publishedVersionId: uuid("published_version_id").references(
      () => contentVersions.id,
      { onDelete: "set null" },
    ),
    latestVersion: integer("latest_version").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("timeline_events_memorial_idx").on(table.memorialId, table.occurredOn),
  ],
);

/** A longer written remembrance, by the family or by an approved visitor. */
export const tributes = pgTable(
  "tributes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    memorialId: uuid("memorial_id")
      .notNull()
      .references(() => memorials.id, { onDelete: "cascade" }),
    authorUserId: uuid("author_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    status: contentStatus("status").default("draft").notNull(),
    publishedVersionId: uuid("published_version_id").references(
      () => contentVersions.id,
      { onDelete: "set null" },
    ),
    latestVersion: integer("latest_version").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [index("tributes_memorial_idx").on(table.memorialId, table.status)],
);

/**
 * One themed stage of a life — childhood, career, later years, and so on.
 *
 * A memorial's life story is broken into these chapters rather than told as one
 * block. The chapter key comes from a curated template (or "custom"); the prose
 * lives in `content_versions` under content type "life_chapter", so a chapter
 * inherits the same versioning, translation and audit machinery as a biography.
 */
export const lifeChapters = pgTable(
  "life_chapters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    memorialId: uuid("memorial_id")
      .notNull()
      .references(() => memorials.id, { onDelete: "cascade" }),
    /** Template key (e.g. "childhood") or "custom". Validated in code. */
    chapterKey: text("chapter_key").notNull(),
    /** A custom chapter's title, or an override of the template default. */
    customTitle: text("custom_title"),
    displayOrder: integer("display_order").default(0).notNull(),
    status: contentStatus("status").default("draft").notNull(),
    publishedVersionId: uuid("published_version_id").references(
      () => contentVersions.id,
      { onDelete: "set null" },
    ),
    latestVersion: integer("latest_version").default(0).notNull(),
    coverMediaId: uuid("cover_media_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("life_chapters_memorial_idx").on(table.memorialId, table.displayOrder),
    // One template chapter of each kind per memorial; "custom" may repeat, so
    // the uniqueness is enforced in the service rather than a partial index the
    // ORM cannot express portably.
  ],
);

/**
 * A photograph attached to a piece of content (a life chapter, a contribution).
 *
 * Kept generic so several content kinds can carry an ordered gallery without a
 * table each. `owner_type` is plain text — a new owner kind needs no enum
 * migration. Public rendering must still gate on the owner being published and
 * the asset being ready.
 */
export const contentMedia = pgTable(
  "content_media",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerType: text("owner_type").notNull(),
    ownerId: uuid("owner_id").notNull(),
    mediaId: uuid("media_id")
      .notNull()
      .references(() => mediaAssets.id, { onDelete: "cascade" }),
    role: text("role").default("gallery").notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    caption: text("caption"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("content_media_owner_idx").on(table.ownerType, table.ownerId),
    uniqueIndex("content_media_owner_media_key").on(
      table.ownerType,
      table.ownerId,
      table.mediaId,
    ),
  ],
);

/**
 * Something a visitor offered: a story, or a photograph.
 *
 * Held apart from family content until someone with the authority to moderate
 * accepts it. A rejected submission stays for the audit trail and must never
 * appear in a public query.
 */
export const visitorSubmissions = pgTable(
  "visitor_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    memorialId: uuid("memorial_id")
      .notNull()
      .references(() => memorials.id, { onDelete: "cascade" }),
    submitterUserId: uuid("submitter_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    kind: submissionKind("kind").notNull(),
    title: text("title"),
    body: text("body").notNull(),
    sourceLocale: text("source_locale").notNull(),
    status: contentStatus("status").default("pending_review").notNull(),
    /** Who may see this message: everyone, only family, or only the author. */
    audience: visitorMessageAudience("audience").default("public").notNull(),
    /**
     * A richer "亲友追忆" contribution rather than a short guestbook message.
     * Both live in this table; this flag is what keeps the two apart in the
     * public sections and the review queue.
     */
    isContribution: boolean("is_contribution").default(false).notNull(),
    /** The contributor's chosen display name and relationship to the deceased. */
    contributorName: text("contributor_name"),
    contributorRelation: text("contributor_relation"),
    /**
     * The contributor's identity was verified at submission time — they hold a
     * confirmed recognition claim on this memorial, or are a member of it. A
     * verified contribution is trusted enough to publish without review and
     * carries the "已认证亲友" badge. Never set from client input; the server
     * re-derives it from the recognition and membership records.
     */
    contributorVerified: boolean("contributor_verified")
      .default(false)
      .notNull(),
    /** A contribution may be tied to one life chapter it enriches. */
    chapterId: uuid("chapter_id").references(() => lifeChapters.id, {
      onDelete: "set null",
    }),
    /** For rate-limiting guest contributions. Never shown. */
    contributorIpHash: text("contributor_ip_hash"),
    moderatedByUserId: uuid("moderated_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    moderatedAt: timestamp("moderated_at", { withTimezone: true }),
    /** Kept for the family's record; never shown to the submitter verbatim. */
    moderationNote: text("moderation_note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("visitor_submissions_memorial_idx").on(
      table.memorialId,
      table.status,
    ),
    index("visitor_submissions_contribution_idx").on(
      table.memorialId,
      table.isContribution,
      table.status,
    ),
  ],
);

/**
 * A private message from a visitor to the family who manages a memorial.
 *
 * Not shown on the page — it reaches the family's manage view only. This is the
 * "contact the manager" channel; a guest may write, leaving a way to reach
 * them back, or a signed-in person writes under their account.
 */
export const memorialContactMessages = pgTable(
  "memorial_contact_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    memorialId: uuid("memorial_id")
      .notNull()
      .references(() => memorials.id, { onDelete: "cascade" }),
    senderUserId: uuid("sender_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    senderName: text("sender_name"),
    /** How to reach the sender back — an email or phone they typed. */
    senderContact: text("sender_contact"),
    body: text("body").notNull(),
    /** For rate-limiting guest messages. Never shown. */
    senderIpHash: text("sender_ip_hash"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("memorial_contact_messages_idx").on(table.memorialId, table.readAt),
  ],
);

export type ContentVersion = typeof contentVersions.$inferSelect;
export type ContentTranslation = typeof contentTranslations.$inferSelect;
export type Biography = typeof biographies.$inferSelect;
export type VisitorSubmission = typeof visitorSubmissions.$inferSelect;
export type LifeChapter = typeof lifeChapters.$inferSelect;
export type ContentMediaLink = typeof contentMedia.$inferSelect;

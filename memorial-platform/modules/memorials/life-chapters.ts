import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  auditLogs,
  contentMedia,
  contentVersions,
  lifeChapters,
  mediaAssets,
} from "@/db/schema";
import { err, ok } from "@/lib/result";
import type { Result } from "@/lib/result";
import { canOnMemorial } from "@/modules/permissions/policy";
import type { Actor } from "@/modules/permissions/types";
import {
  contentMediaPhotos,
  softDeleteMedia,
  type OwnerPhoto,
} from "@/modules/media/service";
import { memorialRoleFor } from "./membership";

const CHAPTER_OWNER_TYPE = "life_chapter";
import {
  CUSTOM_CHAPTER_KEY,
  isValidChapterKey,
  templateOrder,
} from "./life-chapter-catalog";

export type ChapterError =
  | "AUTH_REQUIRED"
  | "MEMORIAL_NOT_FOUND"
  | "MEMORIAL_FORBIDDEN"
  | "CHAPTER_NOT_FOUND"
  | "INVALID_CHAPTER_KEY"
  | "DUPLICATE_CHAPTER"
  | "EMPTY_BODY"
  | "NOTHING_TO_PUBLISH"
  | "MEDIA_NOT_FOUND";

export type ChapterPhoto = {
  mediaId: string;
  url: string | null;
  caption: string | null;
  status: string;
};

type ChapterStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "rejected"
  | "hidden";

/** A published chapter as a public reader sees it. */
export type PublicChapter = {
  id: string;
  chapterKey: string;
  customTitle: string | null;
  body: string;
  displayOrder: number;
  photos: ChapterPhoto[];
};

/** A chapter as the family edits it: latest draft plus publication state. */
export type ManageChapter = {
  id: string;
  chapterKey: string;
  customTitle: string | null;
  displayOrder: number;
  status: ChapterStatus;
  latestVersion: number;
  hasPublished: boolean;
  /** Published, but a newer draft has been saved since. */
  hasUnpublishedEdit: boolean;
  draftBody: string;
  photos: ChapterPhoto[];
};

function groupPhotos(
  photos: OwnerPhoto[],
): Map<string, ChapterPhoto[]> {
  const map = new Map<string, ChapterPhoto[]>();
  for (const p of photos) {
    const list = map.get(p.ownerId) ?? [];
    list.push({
      mediaId: p.mediaId,
      url: p.url,
      caption: p.caption,
      status: p.status,
    });
    map.set(p.ownerId, list);
  }
  return map;
}

async function authorize(
  actor: Actor,
  memorialId: string,
  action: "edit_profile" | "publish_content",
): Promise<Result<true, ChapterError>> {
  if (!actor.userId) {
    return err("AUTH_REQUIRED");
  }
  const role = await memorialRoleFor(memorialId, actor.userId);
  if (!role) {
    return err("MEMORIAL_NOT_FOUND");
  }
  if (!canOnMemorial({ actor, role, action })) {
    return err("MEMORIAL_FORBIDDEN");
  }
  return ok(true);
}

async function memorialIdOfChapter(chapterId: string): Promise<string | null> {
  const [row] = await db()
    .select({ memorialId: lifeChapters.memorialId })
    .from(lifeChapters)
    .where(and(eq(lifeChapters.id, chapterId), isNull(lifeChapters.deletedAt)));
  return row?.memorialId ?? null;
}

/**
 * The published chapters a public reader may see, in display order.
 *
 * The join is on `published_version_id`, so an unpublished edit never leaks:
 * a chapter with a newer draft still shows the version the family published.
 */
export async function listPublicChapters(
  memorialId: string,
): Promise<PublicChapter[]> {
  const rows = await db()
    .select({
      id: lifeChapters.id,
      chapterKey: lifeChapters.chapterKey,
      customTitle: lifeChapters.customTitle,
      displayOrder: lifeChapters.displayOrder,
      body: contentVersions.body,
    })
    .from(lifeChapters)
    .innerJoin(
      contentVersions,
      eq(contentVersions.id, lifeChapters.publishedVersionId),
    )
    .where(
      and(
        eq(lifeChapters.memorialId, memorialId),
        eq(lifeChapters.status, "published"),
        isNull(lifeChapters.deletedAt),
      ),
    )
    .orderBy(asc(lifeChapters.displayOrder));

  const photos = groupPhotos(
    await contentMediaPhotos(
      CHAPTER_OWNER_TYPE,
      rows.map((r) => r.id),
      { readyOnly: true },
    ),
  );

  return rows.map((r) => ({
    id: r.id,
    chapterKey: r.chapterKey,
    customTitle: r.customTitle,
    body: r.body,
    displayOrder: r.displayOrder,
    photos: photos.get(r.id) ?? [],
  }));
}

/**
 * Every chapter the family owns, with the latest draft body.
 *
 * The body comes from the version matching `latest_version`, which is what the
 * editor should open — ahead of the published one when an edit is in progress.
 */
export async function listManageChapters(
  memorialId: string,
): Promise<ManageChapter[]> {
  const rows = await db()
    .select({
      id: lifeChapters.id,
      chapterKey: lifeChapters.chapterKey,
      customTitle: lifeChapters.customTitle,
      displayOrder: lifeChapters.displayOrder,
      status: lifeChapters.status,
      latestVersion: lifeChapters.latestVersion,
      publishedVersionId: lifeChapters.publishedVersionId,
      latestVersionId: contentVersions.id,
      body: contentVersions.body,
    })
    .from(lifeChapters)
    .leftJoin(
      contentVersions,
      and(
        eq(contentVersions.contentType, "life_chapter"),
        eq(contentVersions.contentId, lifeChapters.id),
        eq(contentVersions.version, lifeChapters.latestVersion),
      ),
    )
    .where(
      and(
        eq(lifeChapters.memorialId, memorialId),
        isNull(lifeChapters.deletedAt),
      ),
    )
    .orderBy(asc(lifeChapters.displayOrder));

  const photos = groupPhotos(
    await contentMediaPhotos(
      CHAPTER_OWNER_TYPE,
      rows.map((r) => r.id),
      { readyOnly: false },
    ),
  );

  return rows.map((r) => ({
    id: r.id,
    chapterKey: r.chapterKey,
    customTitle: r.customTitle,
    displayOrder: r.displayOrder,
    status: r.status,
    latestVersion: r.latestVersion,
    hasPublished: r.publishedVersionId !== null,
    hasUnpublishedEdit:
      r.publishedVersionId !== null &&
      r.latestVersionId !== null &&
      r.latestVersionId !== r.publishedVersionId,
    draftBody: r.body ?? "",
    photos: photos.get(r.id) ?? [],
  }));
}

/**
 * Adds an empty chapter of a given kind.
 *
 * A template kind may exist at most once per memorial (a soft-deleted one does
 * not count, so a family can re-add a chapter they removed). "custom" may
 * repeat. The new chapter starts at the end, or at its template position when
 * that leaves a tidy order.
 */
export async function addChapter(
  actor: Actor,
  memorialId: string,
  chapterKey: string,
  correlationId: string,
): Promise<Result<{ chapterId: string }, ChapterError>> {
  const authorized = await authorize(actor, memorialId, "edit_profile");
  if (!authorized.ok) return err(authorized.error);

  if (!isValidChapterKey(chapterKey)) {
    return err("INVALID_CHAPTER_KEY");
  }

  return db().transaction(async (tx) => {
    if (chapterKey !== CUSTOM_CHAPTER_KEY) {
      const [dup] = await tx
        .select({ id: lifeChapters.id })
        .from(lifeChapters)
        .where(
          and(
            eq(lifeChapters.memorialId, memorialId),
            eq(lifeChapters.chapterKey, chapterKey),
            isNull(lifeChapters.deletedAt),
          ),
        );
      if (dup) {
        return err("DUPLICATE_CHAPTER");
      }
    }

    const [maxRow] = await tx
      .select({
        max: sql<number>`coalesce(max(${lifeChapters.displayOrder}), -1)::int`,
      })
      .from(lifeChapters)
      .where(
        and(
          eq(lifeChapters.memorialId, memorialId),
          isNull(lifeChapters.deletedAt),
        ),
      );

    const nextOrder = Math.max(
      (maxRow?.max ?? -1) + 1,
      templateOrder(chapterKey),
    );

    const [created] = await tx
      .insert(lifeChapters)
      .values({
        memorialId,
        chapterKey,
        displayOrder: nextOrder,
        status: "draft",
      })
      .returning({ id: lifeChapters.id });

    if (!created) {
      throw new Error("life chapter insert returned no row");
    }

    await tx.insert(auditLogs).values({
      actorUserId: actor.userId,
      action: "life_chapter.added",
      resourceType: "life_chapter",
      resourceId: created.id,
      newValue: { memorialId, chapterKey },
      correlationId,
    });

    return ok({ chapterId: created.id });
  });
}

/**
 * Saves an edit to a chapter. Appends a version; never overwrites one.
 */
export async function saveChapter(
  actor: Actor,
  chapterId: string,
  input: { body: string; sourceLocale: string; customTitle?: string | null },
  correlationId: string,
): Promise<Result<{ version: number }, ChapterError>> {
  const memorialId = await memorialIdOfChapter(chapterId);
  if (!memorialId) return err("CHAPTER_NOT_FOUND");

  const authorized = await authorize(actor, memorialId, "edit_profile");
  if (!authorized.ok) return err(authorized.error);

  const body = input.body.trim();
  if (body.length === 0) {
    return err("EMPTY_BODY");
  }

  return db().transaction(async (tx) => {
    const [chapter] = await tx
      .select({ latestVersion: lifeChapters.latestVersion })
      .from(lifeChapters)
      .where(eq(lifeChapters.id, chapterId))
      .for("update");

    if (!chapter) return err("CHAPTER_NOT_FOUND");

    const version = chapter.latestVersion + 1;

    await tx.insert(contentVersions).values({
      contentType: "life_chapter",
      contentId: chapterId,
      version,
      title: null,
      body,
      sourceLocale: input.sourceLocale,
      authorUserId: actor.userId,
    });

    await tx
      .update(lifeChapters)
      .set({
        latestVersion: version,
        updatedAt: new Date(),
        ...(input.customTitle !== undefined
          ? { customTitle: input.customTitle?.trim() || null }
          : {}),
      })
      .where(eq(lifeChapters.id, chapterId));

    await tx.insert(auditLogs).values({
      actorUserId: actor.userId,
      action: "life_chapter.version_saved",
      resourceType: "life_chapter",
      resourceId: chapterId,
      newValue: { version, sourceLocale: input.sourceLocale },
      correlationId,
    });

    return ok({ version });
  });
}

/** Makes the latest saved version the one the public sees. */
export async function publishChapter(
  actor: Actor,
  chapterId: string,
  correlationId: string,
): Promise<Result<{ publishedVersion: number }, ChapterError>> {
  const memorialId = await memorialIdOfChapter(chapterId);
  if (!memorialId) return err("CHAPTER_NOT_FOUND");

  const authorized = await authorize(actor, memorialId, "publish_content");
  if (!authorized.ok) return err(authorized.error);

  return db().transaction(async (tx) => {
    const [chapter] = await tx
      .select({
        id: lifeChapters.id,
        latestVersion: lifeChapters.latestVersion,
      })
      .from(lifeChapters)
      .where(eq(lifeChapters.id, chapterId))
      .for("update");

    if (!chapter) return err("CHAPTER_NOT_FOUND");
    if (chapter.latestVersion === 0) return err("NOTHING_TO_PUBLISH");

    const [latest] = await tx
      .select({ id: contentVersions.id, version: contentVersions.version })
      .from(contentVersions)
      .where(
        and(
          eq(contentVersions.contentType, "life_chapter"),
          eq(contentVersions.contentId, chapterId),
          eq(contentVersions.version, chapter.latestVersion),
        ),
      );

    if (!latest) return err("NOTHING_TO_PUBLISH");

    await tx
      .update(lifeChapters)
      .set({ publishedVersionId: latest.id, status: "published" })
      .where(eq(lifeChapters.id, chapterId));

    await tx.insert(auditLogs).values({
      actorUserId: actor.userId,
      action: "life_chapter.published",
      resourceType: "life_chapter",
      resourceId: chapterId,
      newValue: { version: latest.version },
      correlationId,
    });

    return ok({ publishedVersion: latest.version });
  });
}

/** Reorders chapters. Ignores ids that are not this memorial's chapters. */
export async function reorderChapters(
  actor: Actor,
  memorialId: string,
  orderedIds: string[],
  correlationId: string,
): Promise<Result<{ count: number }, ChapterError>> {
  const authorized = await authorize(actor, memorialId, "edit_profile");
  if (!authorized.ok) return err(authorized.error);

  return db().transaction(async (tx) => {
    let count = 0;
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i];
      if (!id) continue;
      const result = await tx
        .update(lifeChapters)
        .set({ displayOrder: i })
        .where(
          and(
            eq(lifeChapters.id, id),
            eq(lifeChapters.memorialId, memorialId),
            isNull(lifeChapters.deletedAt),
          ),
        );
      count += result.rowCount ?? 0;
    }

    await tx.insert(auditLogs).values({
      actorUserId: actor.userId,
      action: "life_chapter.reordered",
      resourceType: "memorial",
      resourceId: memorialId,
      newValue: { count },
      correlationId,
    });

    return ok({ count });
  });
}

/** Soft-deletes a chapter. Its versions stay for the audit trail. */
export async function removeChapter(
  actor: Actor,
  chapterId: string,
  correlationId: string,
): Promise<Result<true, ChapterError>> {
  const memorialId = await memorialIdOfChapter(chapterId);
  if (!memorialId) return err("CHAPTER_NOT_FOUND");

  const authorized = await authorize(actor, memorialId, "edit_profile");
  if (!authorized.ok) return err(authorized.error);

  await db()
    .update(lifeChapters)
    .set({ deletedAt: new Date(), status: "hidden" })
    .where(eq(lifeChapters.id, chapterId));

  await db().insert(auditLogs).values({
    actorUserId: actor.userId,
    action: "life_chapter.removed",
    resourceType: "life_chapter",
    resourceId: chapterId,
    correlationId,
  });

  return ok(true);
}

/**
 * Attaches an uploaded photo to a chapter.
 *
 * The asset must already belong to this chapter's memorial — a link cannot
 * borrow a photo from somewhere else. The link is what keeps the photo out of
 * the general slideshow and inside the chapter.
 */
export async function attachChapterMedia(
  actor: Actor,
  chapterId: string,
  mediaId: string,
  correlationId: string,
): Promise<Result<{ attached: true }, ChapterError>> {
  const memorialId = await memorialIdOfChapter(chapterId);
  if (!memorialId) return err("CHAPTER_NOT_FOUND");

  const authorized = await authorize(actor, memorialId, "edit_profile");
  if (!authorized.ok) return err(authorized.error);

  const [asset] = await db()
    .select({ id: mediaAssets.id })
    .from(mediaAssets)
    .where(
      and(
        eq(mediaAssets.id, mediaId),
        eq(mediaAssets.memorialId, memorialId),
        isNull(mediaAssets.deletedAt),
      ),
    );
  if (!asset) return err("MEDIA_NOT_FOUND");

  const [maxRow] = await db()
    .select({
      max: sql<number>`coalesce(max(${contentMedia.displayOrder}), -1)::int`,
    })
    .from(contentMedia)
    .where(
      and(
        eq(contentMedia.ownerType, CHAPTER_OWNER_TYPE),
        eq(contentMedia.ownerId, chapterId),
      ),
    );

  await db()
    .insert(contentMedia)
    .values({
      ownerType: CHAPTER_OWNER_TYPE,
      ownerId: chapterId,
      mediaId,
      role: "gallery",
      displayOrder: (maxRow?.max ?? -1) + 1,
    })
    .onConflictDoNothing({
      target: [
        contentMedia.ownerType,
        contentMedia.ownerId,
        contentMedia.mediaId,
      ],
    });

  await db().insert(auditLogs).values({
    actorUserId: actor.userId,
    action: "life_chapter.media_attached",
    resourceType: "life_chapter",
    resourceId: chapterId,
    newValue: { mediaId },
    correlationId,
  });

  return ok({ attached: true });
}

/**
 * Removes a photo from a chapter and deletes the underlying asset.
 *
 * A chapter photo is dedicated to that chapter, so detaching it is a delete —
 * it does not fall back into the memorial's general gallery.
 */
export async function detachChapterMedia(
  actor: Actor,
  chapterId: string,
  mediaId: string,
  correlationId: string,
): Promise<Result<{ detached: true }, ChapterError>> {
  const memorialId = await memorialIdOfChapter(chapterId);
  if (!memorialId) return err("CHAPTER_NOT_FOUND");

  const authorized = await authorize(actor, memorialId, "edit_profile");
  if (!authorized.ok) return err(authorized.error);

  await db()
    .delete(contentMedia)
    .where(
      and(
        eq(contentMedia.ownerType, CHAPTER_OWNER_TYPE),
        eq(contentMedia.ownerId, chapterId),
        eq(contentMedia.mediaId, mediaId),
      ),
    );

  // Best-effort: the link is already gone, so a failure here only leaves an
  // orphaned asset, not a broken chapter.
  await softDeleteMedia(actor, mediaId, correlationId);

  return ok({ detached: true });
}

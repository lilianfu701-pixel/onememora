import { randomUUID } from "node:crypto";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { auditLogs, mediaAssets, recognitionClaims, users } from "@/db/schema";
import { err, ok } from "@/lib/result";
import type { Result } from "@/lib/result";
import type { Actor } from "@/modules/permissions/types";
import {
  buildObjectKey,
  safeDisplayFileName,
  validateDeclaredUpload,
} from "@/modules/media/policy";
import { mediaStorage } from "@/modules/media/storage";

const UPLOAD_URL_TTL_SECONDS = 15 * 60;
const READ_URL_TTL_SECONDS = 5 * 60;

export type AvatarError =
  | "AUTH_REQUIRED"
  | "UNSUPPORTED_TYPE"
  | "FILE_TOO_LARGE"
  | "ASSET_NOT_FOUND";

/**
 * Starts an upload for the account holder's own photograph.
 *
 * The asset carries no memorial: it belongs to the person. It still travels
 * the same pipeline as every other image — declared type validated here, magic
 * bytes and metadata handled by the processor — so an avatar cannot smuggle in
 * what a memorial photograph could not.
 */
export async function signAvatarUpload(
  actor: Actor,
  input: { fileName: string; contentType: string; size: number },
  correlationId: string,
): Promise<
  Result<
    {
      mediaAssetId: string;
      url: string;
      headers: Record<string, string>;
      expiresInSeconds: number;
    },
    AvatarError
  >
> {
  if (!actor.userId) return err("AUTH_REQUIRED");

  const policy = validateDeclaredUpload({
    contentType: input.contentType,
    size: input.size,
  });
  if (!policy.ok) {
    return err(
      policy.error === "FILE_TOO_LARGE" ? "FILE_TOO_LARGE" : "UNSUPPORTED_TYPE",
    );
  }
  if (policy.value.kind !== "image") return err("UNSUPPORTED_TYPE");

  const assetId = randomUUID();
  const quarantineObjectKey = buildObjectKey({
    memorialId: actor.userId,
    assetId,
    stage: "quarantine",
    extension: policy.value.extension,
  });

  await db().insert(mediaAssets).values({
    id: assetId,
    memorialId: null,
    uploadedByUserId: actor.userId,
    kind: policy.value.kind,
    declaredContentType: policy.value.contentType,
    declaredBytes: input.size,
    displayFileName: safeDisplayFileName(input.fileName),
    status: "pending_upload",
    quarantineObjectKey,
  });

  await db().insert(auditLogs).values({
    actorUserId: actor.userId,
    action: "avatar.upload_signed",
    resourceType: "media_asset",
    resourceId: assetId,
    correlationId,
  });

  const signed = await mediaStorage().createUploadUrl({
    objectKey: quarantineObjectKey,
    contentType: policy.value.contentType,
    expiresInSeconds: UPLOAD_URL_TTL_SECONDS,
    maxBytes: policy.value.maxBytes,
  });

  return ok({
    mediaAssetId: assetId,
    url: signed.url,
    headers: signed.headers,
    expiresInSeconds: UPLOAD_URL_TTL_SECONDS,
  });
}

/** Points the account at a processed avatar it owns, or clears it. */
export async function setAvatar(
  actor: Actor,
  input: { mediaId: string | null; showInTree?: boolean | undefined },
  correlationId: string,
): Promise<Result<{ saved: true }, AvatarError>> {
  if (!actor.userId) return err("AUTH_REQUIRED");

  if (input.mediaId !== null) {
    const [asset] = await db()
      .select({ id: mediaAssets.id })
      .from(mediaAssets)
      .where(
        and(
          eq(mediaAssets.id, input.mediaId),
          eq(mediaAssets.uploadedByUserId, actor.userId),
          isNull(mediaAssets.memorialId),
          isNull(mediaAssets.deletedAt),
        ),
      );
    if (!asset) return err("ASSET_NOT_FOUND");
  }

  await db()
    .update(users)
    .set({
      avatarMediaId: input.mediaId,
      ...(input.showInTree !== undefined
        ? { showAvatarInTree: input.showInTree }
        : {}),
    })
    .where(eq(users.id, actor.userId));

  await db().insert(auditLogs).values({
    actorUserId: actor.userId,
    action: input.mediaId === null ? "avatar.cleared" : "avatar.set",
    resourceType: "user",
    resourceId: actor.userId,
    newValue: { showInTree: input.showInTree ?? null },
    correlationId,
  });

  return ok({ saved: true });
}

export type AvatarView = {
  mediaId: string | null;
  url: string | null;
  status: string | null;
  showInTree: boolean;
};

/** The account holder's own avatar, for their settings page. */
export async function loadAvatar(userId: string): Promise<AvatarView> {
  const [row] = await db()
    .select({
      avatarMediaId: users.avatarMediaId,
      showAvatarInTree: users.showAvatarInTree,
      status: mediaAssets.status,
      readyObjectKey: mediaAssets.readyObjectKey,
    })
    .from(users)
    .leftJoin(mediaAssets, eq(mediaAssets.id, users.avatarMediaId))
    .where(eq(users.id, userId));

  if (!row || !row.avatarMediaId) {
    return { mediaId: null, url: null, status: null, showInTree: false };
  }

  let url: string | null = null;
  if (row.status === "ready" && row.readyObjectKey) {
    url = await avatarUrl(row.readyObjectKey);
  }

  return {
    mediaId: row.avatarMediaId,
    url,
    status: row.status,
    showInTree: row.showAvatarInTree,
  };
}

/**
 * An address for an avatar object.
 *
 * An avatar is shown wherever the person chose to appear, so it is treated as
 * public when the storage has a public base, and signed otherwise.
 */
async function avatarUrl(readyObjectKey: string): Promise<string> {
  const storage = mediaStorage();
  return (
    storage.publicUrl(readyObjectKey) ??
    (await storage.createReadUrl(readyObjectKey, READ_URL_TTL_SECONDS))
  );
}

/**
 * Avatars for several accounts at once, for the family chart.
 *
 * Only accounts that chose to appear on a chart are returned — the flag is the
 * person's own consent to be shown on someone else's memorial.
 */
/**
 * Avatars keyed by the name a memorial lists a relative under.
 *
 * The link is a confirmed recognition claim: the family vouched that this
 * account is that listed relative. Without confirmation nobody's photograph
 * appears on someone else's memorial, and the account holder must also have
 * chosen to be shown.
 */
export async function avatarsForRelativeNames(
  memorialId: string,
): Promise<Map<string, string>> {
  const found = new Map<string, string>();

  const rows = await db()
    .select({
      claimedName: recognitionClaims.claimedName,
      status: mediaAssets.status,
      readyObjectKey: mediaAssets.readyObjectKey,
    })
    .from(recognitionClaims)
    .innerJoin(users, eq(users.id, recognitionClaims.claimantUserId))
    .innerJoin(mediaAssets, eq(mediaAssets.id, users.avatarMediaId))
    .where(
      and(
        eq(recognitionClaims.memorialId, memorialId),
        eq(recognitionClaims.status, "confirmed"),
        eq(users.showAvatarInTree, true),
        eq(mediaAssets.status, "ready"),
        isNull(mediaAssets.deletedAt),
      ),
    );

  for (const row of rows) {
    if (row.readyObjectKey) {
      found.set(row.claimedName.trim(), await avatarUrl(row.readyObjectKey));
    }
  }

  return found;
}

export async function avatarsForUsers(
  userIds: readonly string[],
): Promise<Map<string, string>> {
  const found = new Map<string, string>();
  if (userIds.length === 0) return found;

  const rows = await db()
    .select({
      userId: users.id,
      status: mediaAssets.status,
      readyObjectKey: mediaAssets.readyObjectKey,
    })
    .from(users)
    .innerJoin(mediaAssets, eq(mediaAssets.id, users.avatarMediaId))
    .where(
      and(
        inArray(users.id, [...userIds]),
        eq(users.showAvatarInTree, true),
        eq(mediaAssets.status, "ready"),
        isNull(mediaAssets.deletedAt),
      ),
    );

  for (const row of rows) {
    if (row.readyObjectKey) {
      found.set(row.userId, await avatarUrl(row.readyObjectKey));
    }
  }

  return found;
}

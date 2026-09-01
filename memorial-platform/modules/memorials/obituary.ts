import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { memorials } from "@/db/schema";
import { err, ok } from "@/lib/result";
import type { Result } from "@/lib/result";
import type { Actor } from "@/modules/permissions/types";
import { canOnMemorial } from "@/modules/permissions/policy";
import { memorialRoleFor } from "./membership";

export interface Obituary {
  body: string | null;
  nativePlace: string | null;
  service: string | null;
  survivors: string | null;
  published: boolean;
}

export type ObituaryError = "AUTH_REQUIRED" | "FORBIDDEN" | "NOT_FOUND";

/** The stored obituary for a memorial (nulls/false when unset). */
export async function getObituary(memorialId: string): Promise<Obituary | null> {
  const [row] = await db()
    .select({
      body: memorials.obituaryBody,
      nativePlace: memorials.obituaryNativePlace,
      service: memorials.obituaryService,
      survivors: memorials.obituarySurvivors,
      publishedAt: memorials.obituaryPublishedAt,
    })
    .from(memorials)
    .where(eq(memorials.id, memorialId));
  if (!row) return null;
  return {
    body: row.body,
    nativePlace: row.nativePlace,
    service: row.service,
    survivors: row.survivors,
    published: row.publishedAt !== null,
  };
}

/**
 * Writes the obituary. Same capability as editing the story (owner/editor).
 * `publish` toggles whether it is public; clearing the body unpublishes it.
 */
export async function setObituary(
  actor: Actor,
  memorialId: string,
  input: {
    body?: string | null;
    nativePlace?: string | null;
    service?: string | null;
    survivors?: string | null;
    publish?: boolean;
  },
): Promise<Result<Obituary, ObituaryError>> {
  if (!actor.userId) return err("AUTH_REQUIRED");

  const [memorial] = await db()
    .select({ id: memorials.id, publishedAt: memorials.obituaryPublishedAt })
    .from(memorials)
    .where(eq(memorials.id, memorialId));
  if (!memorial) return err("NOT_FOUND");

  const role = await memorialRoleFor(memorialId, actor.userId);
  if (!canOnMemorial({ actor, role, action: "publish_content" })) {
    return err("FORBIDDEN");
  }

  const clean = (v: string | null | undefined, max: number): string | null => {
    const t = (v ?? "").trim();
    return t.length > 0 ? t.slice(0, max) : null;
  };
  const body = clean(input.body, 4000);
  const nativePlace = clean(input.nativePlace, 120);
  const service = clean(input.service, 600);
  const survivors = clean(input.survivors, 400);

  // An obituary with no body cannot be published; publishing needs a body.
  const shouldPublish = Boolean(input.publish) && body !== null;
  const publishedAt = shouldPublish
    ? (memorial.publishedAt ?? new Date())
    : null;

  await db()
    .update(memorials)
    .set({
      obituaryBody: body,
      obituaryNativePlace: nativePlace,
      obituaryService: service,
      obituarySurvivors: survivors,
      obituaryPublishedAt: publishedAt,
    })
    .where(eq(memorials.id, memorialId));

  return ok({
    body,
    nativePlace,
    service,
    survivors,
    published: publishedAt !== null,
  });
}

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { auditLogs, memorials } from "@/db/schema";
import { err, ok } from "@/lib/result";
import type { Result } from "@/lib/result";
import { isSupportedLocale } from "@/lib/locale";
import { canOnMemorial } from "@/modules/permissions/policy";
import type { Actor } from "@/modules/permissions/types";
import { memorialRoleFor } from "./membership";

export type ChannelsError =
  | "AUTH_REQUIRED"
  | "MEMORIAL_NOT_FOUND"
  | "MEMORIAL_FORBIDDEN"
  | "INVALID_INPUT";

export type ChannelsInput = {
  /** Locale-code channels this memorial should belong to. */
  regions: string[];
  /** Whether to feature it on those channels' homepages. */
  homepageDisplay: boolean;
};

export type ChannelsResult = {
  regions: string[];
  homepageDisplay: boolean;
};

/**
 * Updates which channels a memorial belongs to and whether it is featured on
 * their homepages. Owner/admin only — the same people who configure the page.
 *
 * Channel values are validated against the supported locale set, and duplicates
 * are dropped, so an arbitrary string can never enter the array.
 */
export async function updateChannels(
  actor: Actor,
  memorialId: string,
  input: ChannelsInput,
  correlationId: string,
): Promise<Result<ChannelsResult, ChannelsError>> {
  if (!actor.userId) {
    return err("AUTH_REQUIRED");
  }

  const role = await memorialRoleFor(memorialId, actor.userId);
  if (!role) {
    return err("MEMORIAL_NOT_FOUND");
  }
  if (!canOnMemorial({ actor, role, action: "change_privacy" })) {
    return err("MEMORIAL_FORBIDDEN");
  }

  const regions = [...new Set(input.regions)].filter((r) =>
    isSupportedLocale(r),
  );
  if (regions.length === 0) {
    // A memorial with no channel would vanish from every homepage and Chinese
    // search; keep at least one.
    return err("INVALID_INPUT");
  }

  await db()
    .update(memorials)
    .set({ regions, homepageDisplay: input.homepageDisplay })
    .where(eq(memorials.id, memorialId));

  await db().insert(auditLogs).values({
    actorUserId: actor.userId,
    action: "memorial.channels_changed",
    resourceType: "memorial",
    resourceId: memorialId,
    newValue: { regions, homepageDisplay: input.homepageDisplay },
    correlationId,
  });

  return ok({ regions, homepageDisplay: input.homepageDisplay });
}

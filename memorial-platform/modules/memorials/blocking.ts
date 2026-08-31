import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { blockedUsers, visitorSubmissions } from "@/db/schema";
import { err, ok } from "@/lib/result";
import type { Result } from "@/lib/result";

/** Whether this user is currently blocked from interacting with a memorial. */
export async function isBlocked(
  memorialId: string,
  userId: string,
): Promise<boolean> {
  const [row] = await db()
    .select({ id: blockedUsers.id })
    .from(blockedUsers)
    .where(
      and(
        eq(blockedUsers.memorialId, memorialId),
        eq(blockedUsers.blockedUserId, userId),
        isNull(blockedUsers.liftedAt),
      ),
    );
  return row !== undefined;
}

export type BlockAuthorError = "NO_AUTHOR";

/**
 * Blocks the registered author of a guestbook message, and hides everything
 * they have written on this memorial. An anonymous message has no account to
 * block, so the family can only delete those.
 */
export async function blockMessageAuthor(input: {
  memorialId: string;
  storyId: string;
  byUserId: string;
}): Promise<Result<{ blockedUserId: string }, BlockAuthorError>> {
  const [story] = await db()
    .select({ submitterUserId: visitorSubmissions.submitterUserId })
    .from(visitorSubmissions)
    .where(
      and(
        eq(visitorSubmissions.id, input.storyId),
        eq(visitorSubmissions.memorialId, input.memorialId),
      ),
    );

  const target = story?.submitterUserId ?? null;
  if (!target) {
    return err("NO_AUTHOR");
  }

  await db()
    .insert(blockedUsers)
    .values({
      memorialId: input.memorialId,
      blockedUserId: target,
      blockedByUserId: input.byUserId,
    })
    .onConflictDoUpdate({
      target: [blockedUsers.memorialId, blockedUsers.blockedUserId],
      set: { liftedAt: null, blockedByUserId: input.byUserId },
    });

  // Take down everything this person has written here.
  await db()
    .update(visitorSubmissions)
    .set({ status: "hidden" })
    .where(
      and(
        eq(visitorSubmissions.memorialId, input.memorialId),
        eq(visitorSubmissions.submitterUserId, target),
      ),
    );

  return ok({ blockedUserId: target });
}

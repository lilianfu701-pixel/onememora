import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { memorialFollowers } from "@/db/schema";

/** A visitor follows a memorial to receive its reminder emails. Idempotent. */
export async function followMemorial(
  memorialId: string,
  userId: string,
): Promise<void> {
  await db()
    .insert(memorialFollowers)
    .values({ memorialId, userId })
    .onConflictDoNothing();
}

export async function unfollowMemorial(
  memorialId: string,
  userId: string,
): Promise<void> {
  await db()
    .delete(memorialFollowers)
    .where(
      and(
        eq(memorialFollowers.memorialId, memorialId),
        eq(memorialFollowers.userId, userId),
      ),
    );
}

export async function isFollowing(
  memorialId: string,
  userId: string,
): Promise<boolean> {
  const [row] = await db()
    .select({ m: memorialFollowers.memorialId })
    .from(memorialFollowers)
    .where(
      and(
        eq(memorialFollowers.memorialId, memorialId),
        eq(memorialFollowers.userId, userId),
      ),
    )
    .limit(1);
  return Boolean(row);
}

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { err, ok } from "@/lib/result";
import type { Result } from "@/lib/result";
import type { Actor } from "@/modules/permissions/types";

export type PlatformRole = "user" | "reviewer" | "super_admin";
export type RoleError = "AUTH_REQUIRED" | "FORBIDDEN" | "SELF" | "NOT_FOUND";

/**
 * Sets another user's platform role. Super-admins only, and never your own row —
 * so an admin can't accidentally strip their own access and lock everyone out.
 */
export async function setPlatformRole(
  actor: Actor,
  targetUserId: string,
  role: PlatformRole,
): Promise<Result<{ role: PlatformRole }, RoleError>> {
  if (!actor.userId) return err("AUTH_REQUIRED");
  if (actor.platformRole !== "super_admin") return err("FORBIDDEN");
  if (targetUserId === actor.userId) return err("SELF");

  const claimed = await db()
    .update(users)
    .set({ platformRole: role })
    .where(eq(users.id, targetUserId))
    .returning({ id: users.id });
  if (!claimed[0]) return err("NOT_FOUND");
  return ok({ role });
}

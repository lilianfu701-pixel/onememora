import { currentActor } from "@/modules/auth/current-user";

export const dynamic = "force-dynamic";

/**
 * Temporary diagnostic: reports what the server resolves the caller to from
 * their session cookie. Safe to expose — only a truncated id and the role.
 */
export async function GET(): Promise<Response> {
  const actor = await currentActor();
  return Response.json(
    {
      authenticated: actor.userId !== null,
      userId: actor.userId ? actor.userId.slice(0, 8) : null,
      platformRole: actor.platformRole,
    },
    { headers: { "cache-control": "no-store" } },
  );
}

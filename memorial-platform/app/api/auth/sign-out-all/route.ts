import { correlationIdFrom, jsonError, jsonSuccess } from "@/lib/api";
import { clearSessionCookie } from "@/modules/auth/cookies";
import { currentActor } from "@/modules/auth/current-user";
import { revokeAllSessionsForUser } from "@/modules/auth/sessions";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const correlationId = correlationIdFrom(request);
  const actor = await currentActor();

  if (!actor.userId) {
    return jsonError("AUTH_REQUIRED", correlationId);
  }

  await revokeAllSessionsForUser({ userId: actor.userId });

  return clearSessionCookie(
    jsonSuccess({ signedOut: true }, correlationId),
  );
}

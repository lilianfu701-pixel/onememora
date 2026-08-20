import { z } from "zod";
import { and, eq } from "drizzle-orm";
import {
  correlationIdFrom,
  jsonError,
  jsonSuccess,
  readJson,
} from "@/lib/api";
import { db } from "@/db/client";
import { memorialRelatives } from "@/db/schema";
import { currentActor } from "@/modules/auth/current-user";
import { pickKinshipChallenge } from "@/modules/memorials/kinship-challenge";

export const dynamic = "force-dynamic";

const schema = z.object({
  claimedName: z.string().trim().min(1).max(200),
});

/**
 * Whether a kinship challenge is available for someone claiming `claimedName`.
 *
 * Only a relationship label is ever returned — never a name. Restricted to
 * someone the memorial actually lists under that name, so it cannot be used to
 * probe arbitrary memorials for whether they hold a hidden relative.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const correlationId = correlationIdFrom(request);
  const { id } = await context.params;

  if (!z.uuid().safeParse(id).success) {
    return jsonError("MEMORIAL_NOT_FOUND", correlationId);
  }

  const actor = await currentActor();
  if (!actor.userId) {
    return jsonError("AUTH_REQUIRED", correlationId);
  }

  const body = await readJson(request, schema, correlationId);
  if (!body.ok) return body.response;

  // The caller must actually be listed under this name.
  const [listed] = await db()
    .select({ id: memorialRelatives.id })
    .from(memorialRelatives)
    .where(
      and(
        eq(memorialRelatives.memorialId, id),
        eq(memorialRelatives.name, body.value.claimedName),
      ),
    )
    .limit(1);

  if (!listed) {
    return jsonSuccess({ available: false }, correlationId);
  }

  const challenge = await pickKinshipChallenge(id, body.value.claimedName);

  return jsonSuccess(
    challenge
      ? { available: true, relationship: challenge.relationship }
      : { available: false },
    correlationId,
  );
}

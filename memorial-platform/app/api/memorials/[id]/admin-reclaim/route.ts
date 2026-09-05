import { z } from "zod";
import { correlationIdFrom, jsonError, jsonSuccess } from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import { adminReclaimMemorial } from "@/modules/memorials/ownership";

export const dynamic = "force-dynamic";

/**
 * Platform override: a super admin reclaims management of a memorial. No
 * request, no grace period — ownership passes to the admin immediately.
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
  const result = await adminReclaimMemorial(actor, id, correlationId);

  if (!result.ok) {
    switch (result.error) {
      case "AUTH_REQUIRED":
        return jsonError("AUTH_REQUIRED", correlationId);
      case "FORBIDDEN":
        return jsonError("MEMORIAL_FORBIDDEN", correlationId);
      default:
        return jsonError("MEMORIAL_NOT_FOUND", correlationId);
    }
  }

  return jsonSuccess({ reclaimed: true }, correlationId, 200);
}

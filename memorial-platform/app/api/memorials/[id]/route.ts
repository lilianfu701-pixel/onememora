import { z } from "zod";
import { correlationIdFrom, jsonError, jsonSuccess } from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import { requestDeletion } from "@/modules/memorials/deletion";
import { drainOutboxAfterResponse } from "@/modules/outbox/drain-after";

export const dynamic = "force-dynamic";

/**
 * The owner deletes a memorial. This is a soft delete: it stops being reachable
 * immediately, and the worker purges media and search after a 30-day recovery
 * window. Owner only.
 */
export async function DELETE(
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

  const result = await requestDeletion(
    actor,
    id,
    { confirmed: true },
    correlationId,
  );

  if (!result.ok) {
    switch (result.error) {
      case "AUTH_REQUIRED":
        return jsonError("AUTH_REQUIRED", correlationId);
      case "MEMORIAL_NOT_FOUND":
        return jsonError("MEMORIAL_NOT_FOUND", correlationId);
      case "MEMORIAL_FORBIDDEN":
      case "OWNERSHIP_FROZEN":
        return jsonError("MEMORIAL_FORBIDDEN", correlationId);
      case "CONFIRMATION_REQUIRED":
        return jsonError("INVALID_INPUT", correlationId);
      case "ALREADY_REQUESTED":
        // Deleting something already being deleted is a success from the
        // owner's point of view — it is gone from their list either way.
        return jsonSuccess({ alreadyRequested: true }, correlationId);
    }
  }

  drainOutboxAfterResponse(correlationId);
  return jsonSuccess({ deleted: true }, correlationId);
}

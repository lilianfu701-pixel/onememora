import { correlationIdFrom, jsonError, jsonSuccess } from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import {
  markUploadComplete,
  processUploadedAsset,
} from "@/modules/media/service";
import { AlwaysCleanScanner } from "@/modules/media/storage";
import { drainOutboxAfterResponse } from "@/modules/outbox/drain-after";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Marks an upload as complete so the processing pipeline picks it up.
 *
 * The client calls this after a successful PUT to the presigned URL. The asset
 * moves from `pending_upload` to `scanning`, and a `media.process` outbox
 * event is published so the worker (or the inline drain) starts verification.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const correlationId = correlationIdFrom(request);
  const { id } = await context.params;

  if (!UUID_RE.test(id)) {
    return jsonError("MEMORIAL_NOT_FOUND", correlationId);
  }

  const actor = await currentActor();
  if (!actor.userId) {
    return jsonError("AUTH_REQUIRED", correlationId);
  }

  const result = await markUploadComplete(actor, id, correlationId);

  if (!result.ok) {
    switch (result.error) {
      case "ASSET_NOT_FOUND":
      case "MEMORIAL_NOT_FOUND":
        return jsonError("MEMORIAL_NOT_FOUND", correlationId);
      case "MEMORIAL_FORBIDDEN":
        return jsonError("MEMORIAL_FORBIDDEN", correlationId);
      case "NOT_AWAITING_PROCESSING":
        return jsonError("INVALID_INPUT", correlationId);
    }
  }

  // Process the image synchronously so it becomes `ready` immediately. Relying
  // on the async outbox drain leaves portraits stuck "处理中" when the inline
  // drain does not run and the scheduled drain is a day away. A failure here is
  // swallowed — the outbox event (published by markUploadComplete) remains as
  // the retry path — but for a valid image this makes the portrait usable at
  // once, on the memorial page and the obituary poster alike.
  let status: string = result.value.status;
  try {
    const processed = await processUploadedAsset(
      result.value.mediaAssetId,
      new AlwaysCleanScanner(),
      correlationId,
    );
    if (processed.ok) status = "ready";
  } catch {
    /* leave it to the outbox retry path */
  }

  drainOutboxAfterResponse(correlationId);

  return jsonSuccess(
    { mediaAssetId: result.value.mediaAssetId, status },
    correlationId,
    202,
  );
}

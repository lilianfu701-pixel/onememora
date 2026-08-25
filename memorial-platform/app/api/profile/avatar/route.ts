import { z } from "zod";
import {
  correlationIdFrom,
  jsonError,
  jsonSuccess,
  jsonUnprocessable,
  readJson,
} from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import { setAvatar, signAvatarUpload } from "@/modules/identity/avatar";

export const dynamic = "force-dynamic";

const signSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(3).max(100),
  size: z.number().int().positive(),
});

/** Starts an upload for the signed-in person's own photograph. */
export async function POST(request: Request): Promise<Response> {
  const correlationId = correlationIdFrom(request);
  const body = await readJson(request, signSchema, correlationId);
  if (!body.ok) return body.response;

  const actor = await currentActor();
  const result = await signAvatarUpload(actor, body.value, correlationId);

  if (!result.ok) {
    if (result.error === "AUTH_REQUIRED") {
      return jsonError("AUTH_REQUIRED", correlationId);
    }
    return jsonUnprocessable(correlationId, {
      file: [
        result.error === "FILE_TOO_LARGE"
          ? "That image is too large."
          : "That file type is not supported.",
      ],
    });
  }

  return jsonSuccess(result.value, correlationId, 201);
}

const saveSchema = z.object({
  mediaId: z.uuid().nullable(),
  showInTree: z.boolean().optional(),
});

/** Sets or clears the avatar, and whether it may appear on a family chart. */
export async function PUT(request: Request): Promise<Response> {
  const correlationId = correlationIdFrom(request);
  const body = await readJson(request, saveSchema, correlationId);
  if (!body.ok) return body.response;

  const actor = await currentActor();
  const result = await setAvatar(actor, body.value, correlationId);

  if (!result.ok) {
    if (result.error === "AUTH_REQUIRED") {
      return jsonError("AUTH_REQUIRED", correlationId);
    }
    return jsonError("MEMORIAL_NOT_FOUND", correlationId);
  }

  return jsonSuccess({ saved: true }, correlationId);
}

import { z } from "zod";
import {
  correlationIdFrom,
  jsonError,
  jsonSuccess,
  readJson,
} from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import { setDisposition } from "@/modules/memorials/disposition";

export const dynamic = "force-dynamic";

const schema = z.object({
  method: z
    .enum(["ground", "cremation", "tree", "sea", "columbarium", "donation", "other", ""])
    .nullable()
    .optional(),
  place: z.string().trim().max(200).optional(),
  date: z.string().trim().max(40).optional(),
  note: z.string().trim().max(200).optional(),
  lng: z.string().trim().max(32).optional(),
  lat: z.string().trim().max(32).optional(),
  mediaId: z.uuid().nullable().optional(),
});

/** Owner/editor sets the memorial's final-disposition record (身后安置). */
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const correlationId = correlationIdFrom(request);
  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success) {
    return jsonError("MEMORIAL_NOT_FOUND", correlationId);
  }

  const body = await readJson(request, schema, correlationId);
  if (!body.ok) return body.response;

  const actor = await currentActor();
  const result = await setDisposition(actor, id, {
    method: body.value.method ? body.value.method : null,
    place: body.value.place ?? null,
    date: body.value.date ?? null,
    note: body.value.note ?? null,
    lng: body.value.lng ?? null,
    lat: body.value.lat ?? null,
    mediaId: body.value.mediaId ?? null,
  });
  if (!result.ok) {
    if (result.error === "AUTH_REQUIRED") {
      return jsonError("AUTH_REQUIRED", correlationId);
    }
    return jsonError("MEMORIAL_NOT_FOUND", correlationId);
  }
  return jsonSuccess(result.value, correlationId, 200);
}

import { z } from "zod";
import {
  correlationIdFrom,
  jsonError,
  jsonSuccess,
  readJson,
} from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import { updateDeceasedDates } from "@/modules/memorials/deceased";

export const dynamic = "force-dynamic";

const dayOrEmpty = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .or(z.literal(""))
  .optional();

const schema = z.object({
  birthDate: dayOrEmpty,
  deathDate: dayOrEmpty,
});

/** Owner/editor updates the deceased's birth and death dates. */
export async function PATCH(
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
  const result = await updateDeceasedDates(actor, id, {
    birthDate: body.value.birthDate ? body.value.birthDate : null,
    deathDate: body.value.deathDate ? body.value.deathDate : null,
  });

  if (!result.ok) {
    if (result.error === "AUTH_REQUIRED") {
      return jsonError("AUTH_REQUIRED", correlationId);
    }
    return jsonError("MEMORIAL_NOT_FOUND", correlationId);
  }
  return jsonSuccess(result.value, correlationId, 200);
}

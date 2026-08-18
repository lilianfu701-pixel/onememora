import { z } from "zod";
import { correlationIdFrom, jsonError, jsonSuccess, readJson } from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import { saveProfile } from "@/modules/identity/profile";

export const dynamic = "force-dynamic";

const schema = z.object({
  fullName: z.string().trim().max(120),
  gender: z.enum(["male", "female", "other"]).nullable(),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  region: z.string().trim().max(120).nullable(),
  nameVisibility: z.enum(["public", "family", "hidden"]).nullable().optional(),
});

/** Saves the signed-in person's own profile. */
export async function PUT(request: Request): Promise<Response> {
  const correlationId = correlationIdFrom(request);

  const actor = await currentActor();
  if (!actor.userId) {
    return jsonError("AUTH_REQUIRED", correlationId);
  }

  const body = await readJson(request, schema, correlationId);
  if (!body.ok) {
    return body.response;
  }

  await saveProfile(actor.userId, {
    fullName: body.value.fullName,
    gender: body.value.gender,
    birthDate: body.value.birthDate,
    region: body.value.region,
    nameVisibility: body.value.nameVisibility ?? null,
  });

  return jsonSuccess({ saved: true }, correlationId);
}

import { z } from "zod";
import {
  correlationIdFrom,
  jsonError,
  jsonSuccess,
  readJson,
} from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import { findPublicDuplicatesForInput } from "@/modules/search/duplicates";

export const dynamic = "force-dynamic";

const yearFrom = (date?: string | null): number | null => {
  if (!date) return null;
  const year = Number(date.slice(0, 4));
  return Number.isInteger(year) && year > 0 ? year : null;
};

const schema = z.object({
  name: z.string().trim().min(1).max(200),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullish(),
  deathDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullish(),
});

/**
 * Warns the create flow about public memorials that may already describe this
 * person. Advisory only — the client shows them and lets the family proceed.
 */
export async function POST(request: Request): Promise<Response> {
  const correlationId = correlationIdFrom(request);

  const actor = await currentActor();
  if (!actor.userId) {
    return jsonError("AUTH_REQUIRED", correlationId);
  }

  const body = await readJson(request, schema, correlationId);
  if (!body.ok) return body.response;

  const matches = await findPublicDuplicatesForInput({
    name: body.value.name,
    birthYear: yearFrom(body.value.birthDate),
    deathYear: yearFrom(body.value.deathDate),
  });

  return jsonSuccess(
    {
      matches: matches.map((m) => ({
        slug: m.slug,
        name: m.primaryName,
        birthYear: m.birthYear,
        deathYear: m.deathYear,
      })),
    },
    correlationId,
  );
}

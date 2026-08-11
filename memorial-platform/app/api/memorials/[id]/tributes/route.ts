import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { memorials } from "@/db/schema";
import {
  correlationIdFrom,
  jsonError,
  jsonSuccess,
  readJson,
} from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import { addTribute, tributeCounts } from "@/modules/commemorations/tributes";

export const dynamic = "force-dynamic";

const schema = z.object({
  type: z.enum(["candle", "flower"]),
});

/**
 * A visitor lights a candle or offers flowers. No sign-in required; returns the
 * updated counts so the page can reflect the act immediately.
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

  const body = await readJson(request, schema, correlationId);
  if (!body.ok) {
    return body.response;
  }

  const [memorial] = await db()
    .select({ status: memorials.status })
    .from(memorials)
    .where(eq(memorials.id, id));

  if (!memorial || memorial.status !== "published") {
    return jsonError("MEMORIAL_NOT_FOUND", correlationId);
  }

  const actor = await currentActor();
  await addTribute(id, body.value.type, actor.userId ?? null);
  const counts = await tributeCounts(id);

  return jsonSuccess(counts, correlationId, 201);
}

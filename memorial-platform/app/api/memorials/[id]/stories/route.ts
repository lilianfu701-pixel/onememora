import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { memorials, visitorSubmissions } from "@/db/schema";
import {
  correlationIdFrom,
  jsonError,
  jsonSuccess,
  readJson,
} from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().max(60).optional(),
  message: z.string().trim().min(1).max(2000),
  locale: z.string().min(2).max(10).default("en"),
  audience: z.enum(["public", "family", "private"]).default("public"),
});

/**
 * A visitor leaves a message on the guestbook.
 *
 * Stored as a `story` visitor submission and shown immediately. The memorial
 * owner can hide any message afterwards (DELETE on the message). Only a
 * published memorial accepts messages — a draft is not public yet.
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

  // A private message is kept for its author, so it only makes sense once we
  // know who that is.
  if (body.value.audience === "private" && !actor.userId) {
    return jsonError("AUTH_REQUIRED", correlationId);
  }

  const name = body.value.name?.trim() || null;
  const message = body.value.message.trim();

  const [row] = await db()
    .insert(visitorSubmissions)
    .values({
      memorialId: id,
      submitterUserId: actor.userId ?? null,
      kind: "story",
      title: name,
      body: message,
      sourceLocale: body.value.locale,
      status: "published",
      audience: body.value.audience,
    })
    .returning({ id: visitorSubmissions.id });

  return jsonSuccess(
    {
      id: row?.id,
      title: name,
      body: message,
      audience: body.value.audience,
      isOwn: true,
    },
    correlationId,
    201,
  );
}

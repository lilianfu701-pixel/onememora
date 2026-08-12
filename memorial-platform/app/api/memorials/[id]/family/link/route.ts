import { z } from "zod";
import {
  correlationIdFrom,
  jsonError,
  jsonSuccess,
  readJson,
} from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import { linkMemorials, unlinkMemorial } from "@/modules/genealogy/memorial-graph";

export const dynamic = "force-dynamic";

const schema = z.object({
  otherMemorialId: z.uuid(),
  relation: z.enum(["parent", "spouse", "child"]),
});

/**
 * Links this memorial to another in the family graph. The owner picks another
 * of their memorials and how it relates; because they steward both sides, the
 * edge is confirmed at once.
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
  if (!actor.userId) {
    return jsonError("AUTH_REQUIRED", correlationId);
  }

  const body = await readJson(request, schema, correlationId);
  if (!body.ok) {
    return body.response;
  }

  const result = await linkMemorials(
    actor,
    id,
    body.value.otherMemorialId,
    body.value.relation,
    correlationId,
  );

  if (!result.ok) {
    switch (result.error) {
      case "AUTH_REQUIRED":
        return jsonError("AUTH_REQUIRED", correlationId);
      case "MEMORIAL_NOT_FOUND":
        return jsonError("MEMORIAL_NOT_FOUND", correlationId);
      case "MEMORIAL_FORBIDDEN":
        return jsonError("MEMORIAL_FORBIDDEN", correlationId);
      default:
        // WOULD_CREATE_CYCLE, NOT_YOUR_SIDE, SAME_MEMORIAL, DUPLICATE_LINK, …
        return jsonError("INVALID_INPUT", correlationId);
    }
  }

  return jsonSuccess({ status: result.value.status }, correlationId, 201);
}

/**
 * Removes a family link. The link id comes as `?linkId=…`. Only the owner of
 * both connected memorials may remove it — enforced in `unlinkMemorial` — which
 * is also how a link entered in the wrong direction gets undone before being
 * added again correctly.
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

  const linkId = new URL(request.url).searchParams.get("linkId");
  if (!linkId || !z.uuid().safeParse(linkId).success) {
    return jsonError("INVALID_INPUT", correlationId);
  }

  const result = await unlinkMemorial(actor, linkId, correlationId);
  if (!result.ok) {
    switch (result.error) {
      case "AUTH_REQUIRED":
        return jsonError("AUTH_REQUIRED", correlationId);
      case "LINK_NOT_FOUND":
        return jsonError("MEMORIAL_NOT_FOUND", correlationId);
      case "NOT_YOUR_SIDE":
        return jsonError("MEMORIAL_FORBIDDEN", correlationId);
      default:
        return jsonError("INVALID_INPUT", correlationId);
    }
  }

  return jsonSuccess({ linkId: result.value.linkId }, correlationId);
}

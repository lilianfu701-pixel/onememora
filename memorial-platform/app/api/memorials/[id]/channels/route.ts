import { z } from "zod";
import {
  correlationIdFrom,
  jsonError,
  jsonSuccess,
  jsonUnprocessable,
} from "@/lib/api";
import { readJson } from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import { updateChannels } from "@/modules/memorials/channels";

export const dynamic = "force-dynamic";

const schema = z.object({
  regions: z.array(z.string().min(2).max(10)).min(1).max(15),
  homepageDisplay: z.boolean(),
});

/**
 * Sets which channels a memorial belongs to and whether it is featured on their
 * homepages. Owner/admin only.
 */
export async function PATCH(
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

  const result = await updateChannels(actor, id, body.value, correlationId);

  if (!result.ok) {
    switch (result.error) {
      case "AUTH_REQUIRED":
        return jsonError("AUTH_REQUIRED", correlationId);
      case "MEMORIAL_NOT_FOUND":
        return jsonError("MEMORIAL_NOT_FOUND", correlationId);
      case "MEMORIAL_FORBIDDEN":
        return jsonError("MEMORIAL_FORBIDDEN", correlationId);
      case "INVALID_INPUT":
        return jsonUnprocessable(correlationId, {
          regions: ["Choose at least one channel."],
        });
    }
  }

  return jsonSuccess(
    { regions: result.value.regions, homepageDisplay: result.value.homepageDisplay },
    correlationId,
  );
}

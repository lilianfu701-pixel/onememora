import { z } from "zod";
import {
  correlationIdFrom,
  jsonError,
  jsonSuccess,
  jsonUnprocessable,
  readJson,
} from "@/lib/api";
import { currentActor } from "@/modules/auth/current-user";
import { isProfileComplete, loadProfile } from "@/modules/identity/profile";
import { createMemorial } from "@/modules/memorials/service";
import type { CreateMemorialError } from "@/modules/memorials/service";
import { drainOutboxAfterResponse } from "@/modules/outbox/drain-after";

const partialDate = z.object({
  value: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    error: "Use the format YYYY-MM-DD.",
  }),
  precision: z.enum(["day", "month", "year", "approximate", "unknown"]),
});

const nameSchema = z.object({
  value: z.string().trim().min(1, { error: "A name is required." }).max(200),
  locale: z.string().min(2).max(10).optional(),
  script: z.string().min(4).max(4).optional(),
});

const schema = z.object({
  relationship: z.enum(
    [
      "spouse",
      "parent",
      "child",
      "husband",
      "wife",
      "father",
      "mother",
      "paternal_grandfather",
      "paternal_grandmother",
      "maternal_grandfather",
      "maternal_grandmother",
      "son",
      "daughter",
    ],
    { error: "Choose your relationship to them." },
  ),
  relationshipStatementAccepted: z.boolean(),
  primaryName: nameSchema,
  aliases: z
    .array(
      nameSchema.extend({
        type: z
          .enum(["former", "native", "transliteration", "alias"])
          .optional(),
        searchable: z.boolean().optional(),
      }),
    )
    .max(20)
    .optional(),
  birthDate: partialDate.optional(),
  deathDate: partialDate.optional(),
  locations: z
    .array(
      z.object({
        kind: z.enum(["birth", "death", "lived", "resting_place"]),
        country: z.string().length(2).optional(),
        region: z.string().max(120).optional(),
        city: z.string().max(120).optional(),
      }),
    )
    .max(10)
    .optional(),
  ancestralHometown: z.string().max(200).optional(),
  faith: z.string().max(200).optional(),
  causeOfDeath: z.string().max(500).optional(),
  relatives: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(200),
        relationshipToDeceased: z.string().trim().min(1).max(60),
        isDeceased: z.boolean(),
        showFullName: z.boolean().optional(),
      }),
    )
    .max(30)
    .optional(),
  coCreators: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(200),
        relationshipToDeceased: z.string().trim().min(1).max(60),
      }),
    )
    .max(10)
    .optional(),
  visibility: z.enum(["public", "unlisted", "invite_only"]).optional(),
  searchEngineIndexable: z.boolean().optional(),
  // Honoured only for admin accounts (checked in the service).
  asAdminSteward: z.boolean().optional(),
});

const FIELD_FOR_ERROR: Record<CreateMemorialError, string> = {
  AUTH_REQUIRED: "_",
  RELATIONSHIP_NOT_ELIGIBLE: "relationship",
  STATEMENT_NOT_ACCEPTED: "relationshipStatementAccepted",
  INVALID_NAME: "primaryName",
  INVALID_DATES: "deathDate",
};

const MESSAGE_FOR_ERROR: Record<CreateMemorialError, string> = {
  AUTH_REQUIRED: "Please sign in to continue.",
  RELATIONSHIP_NOT_ELIGIBLE:
    "Only a direct family member can create a memorial.",
  STATEMENT_NOT_ACCEPTED:
    "Please confirm the information is true and accept responsibility for this memorial.",
  INVALID_NAME: "Enter the name of the person being remembered.",
  INVALID_DATES: "The date of death cannot come before the date of birth.",
};

/**
 * Creates a memorial.
 *
 * Requires `Idempotency-Key`. A creation request that is retried after a dropped
 * connection must not leave a family with two memorials for one death, and the
 * key is what lets the server tell a retry from a second bereavement.
 */
export async function POST(request: Request): Promise<Response> {
  const correlationId = correlationIdFrom(request);

  const idempotencyKey = request.headers.get("idempotency-key");
  if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 200) {
    return jsonUnprocessable(correlationId, {
      _: ["A valid Idempotency-Key header is required."],
    });
  }

  const actor = await currentActor();
  if (!actor.userId) {
    return jsonError("AUTH_REQUIRED", correlationId);
  }

  // The account holder must have completed their own profile first.
  if (!isProfileComplete(await loadProfile(actor.userId))) {
    return jsonUnprocessable(correlationId, {
      _: ["Complete your profile before creating a memorial."],
    });
  }

  const body = await readJson(request, schema, correlationId);
  if (!body.ok) {
    return body.response;
  }

  const result = await createMemorial(
    actor,
    body.value,
    idempotencyKey,
    correlationId,
  );

  if (!result.ok) {
    if (result.error === "AUTH_REQUIRED") {
      return jsonError("AUTH_REQUIRED", correlationId);
    }
    if (result.error === "RELATIONSHIP_NOT_ELIGIBLE") {
      return jsonError("RELATIONSHIP_NOT_ELIGIBLE", correlationId);
    }
    return jsonUnprocessable(correlationId, {
      [FIELD_FOR_ERROR[result.error]]: [MESSAGE_FOR_ERROR[result.error]],
    });
  }

  // Only on a first creation. A replay changed nothing, and its events were
  // already drained by the request that did. Co-creators are persisted with the
  // memorial (as relative rows) inside createMemorial, so there is no email
  // invitation to send here.
  if (result.value.created) {
    drainOutboxAfterResponse(correlationId);
  }

  return jsonSuccess(
    {
      memorialId: result.value.memorialId,
      slug: result.value.slug,
      // Duplicate detection arrives with the search work; the field is present
      // from the start so clients do not have to change shape later.
      duplicateCandidates: [],
    },
    correlationId,
    // 201 for a first creation, 200 for an idempotent replay. A client that
    // retried after a timeout can tell whether it caused the memorial to exist.
    result.value.created ? 201 : 200,
  );
}

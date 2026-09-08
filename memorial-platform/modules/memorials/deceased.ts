import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { deceasedPeople, memorials } from "@/db/schema";
import { err, ok } from "@/lib/result";
import type { Result } from "@/lib/result";
import type { Actor } from "@/modules/permissions/types";
import { canOnMemorial } from "@/modules/permissions/policy";
import { memorialRoleFor } from "./membership";

export type DeceasedDatesError = "AUTH_REQUIRED" | "FORBIDDEN" | "NOT_FOUND";

const isDay = (v: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(v);

/**
 * Updates the deceased person's birth and death dates (day precision, or clears
 * them). Same capability as editing the profile — owner/editor. Used by the
 * manage page so a family can correct the dates entered at creation.
 */
export async function updateDeceasedDates(
  actor: Actor,
  memorialId: string,
  input: { birthDate: string | null; deathDate: string | null },
): Promise<Result<{ birthDate: string | null; deathDate: string | null }, DeceasedDatesError>> {
  if (!actor.userId) return err("AUTH_REQUIRED");

  const [memorial] = await db()
    .select({ deceasedPersonId: memorials.deceasedPersonId })
    .from(memorials)
    .where(eq(memorials.id, memorialId));
  if (!memorial) return err("NOT_FOUND");

  const role = await memorialRoleFor(memorialId, actor.userId);
  if (!canOnMemorial({ actor, role, action: "edit_profile" })) {
    return err("FORBIDDEN");
  }

  const birth = input.birthDate && isDay(input.birthDate) ? input.birthDate : null;
  const death = input.deathDate && isDay(input.deathDate) ? input.deathDate : null;

  await db()
    .update(deceasedPeople)
    .set({
      birthDate: birth,
      birthDatePrecision: birth ? "day" : "unknown",
      deathDate: death,
      deathDatePrecision: death ? "day" : "unknown",
    })
    .where(eq(deceasedPeople.id, memorial.deceasedPersonId));

  return ok({ birthDate: birth, deathDate: death });
}

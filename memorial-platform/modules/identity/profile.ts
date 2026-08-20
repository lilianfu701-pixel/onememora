import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";

/** The account holder's own details. */
export type Profile = {
  fullName: string | null;
  gender: string | null;
  birthDate: string | null;
  birthplace: string | null;
  /**
   * How the person's own name shows when a memorial lists them as a living
   * relative: `public`, `family`, `hidden`, or null for "no preference". When
   * set, it overrides the memorial's per-relative setting once a recognition
   * claim ties this account to the listed name.
   */
  nameVisibility: string | null;
};

export async function loadProfile(userId: string): Promise<Profile | null> {
  const [row] = await db()
    .select({
      fullName: users.fullName,
      gender: users.gender,
      birthDate: users.birthDate,
      birthplace: users.birthplace,
      nameVisibility: users.nameVisibility,
    })
    .from(users)
    .where(eq(users.id, userId));
  return row ?? null;
}

/**
 * Enough to create a memorial for a family member: who you are (name), your
 * gender and your birth date. Birthplace stays optional.
 */
export function isProfileComplete(profile: Profile | null): boolean {
  return Boolean(
    profile &&
      profile.fullName &&
      profile.fullName.trim().length > 0 &&
      profile.gender &&
      profile.birthDate,
  );
}

export async function saveProfile(
  userId: string,
  data: Profile,
): Promise<void> {
  const clean = (value: string | null): string | null => {
    const trimmed = value?.trim() ?? "";
    return trimmed.length > 0 ? trimmed : null;
  };
  const visibility =
    data.nameVisibility === "public" ||
    data.nameVisibility === "family" ||
    data.nameVisibility === "hidden"
      ? data.nameVisibility
      : null;
  await db()
    .update(users)
    .set({
      fullName: clean(data.fullName),
      gender: clean(data.gender),
      birthDate: clean(data.birthDate),
      birthplace: clean(data.birthplace),
      nameVisibility: visibility,
    })
    .where(eq(users.id, userId));
}

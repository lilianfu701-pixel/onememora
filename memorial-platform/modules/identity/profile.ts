import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";

/** The account holder's own details. */
export type Profile = {
  fullName: string | null;
  gender: string | null;
  birthDate: string | null;
  region: string | null;
};

export async function loadProfile(userId: string): Promise<Profile | null> {
  const [row] = await db()
    .select({
      fullName: users.fullName,
      gender: users.gender,
      birthDate: users.birthDate,
      region: users.region,
    })
    .from(users)
    .where(eq(users.id, userId));
  return row ?? null;
}

/**
 * Enough to create a memorial for a family member: who you are (name), your
 * gender and your birth date. Region stays optional.
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
  await db()
    .update(users)
    .set({
      fullName: clean(data.fullName),
      gender: clean(data.gender),
      birthDate: clean(data.birthDate),
      region: clean(data.region),
    })
    .where(eq(users.id, userId));
}

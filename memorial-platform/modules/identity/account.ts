import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  users,
  emailCredentials,
  phoneCredentials,
  userIdentities,
} from "@/db/schema";

export type AccountInfo = {
  email: string | null;
  phone: string | null;
  providers: string[];
  createdAt: Date;
  preferredLocale: string;
};

export async function loadAccountInfo(
  userId: string,
): Promise<AccountInfo | null> {
  const [user] = await db()
    .select({
      createdAt: users.createdAt,
      preferredLocale: users.preferredLocale,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) return null;

  const [emailRow] = await db()
    .select({ email: emailCredentials.email })
    .from(emailCredentials)
    .where(eq(emailCredentials.userId, userId));

  const [phoneRow] = await db()
    .select({ phone: phoneCredentials.phoneE164 })
    .from(phoneCredentials)
    .where(eq(phoneCredentials.userId, userId));

  const identityRows = await db()
    .select({ provider: userIdentities.provider })
    .from(userIdentities)
    .where(eq(userIdentities.userId, userId));

  const providers = identityRows
    .map((r) => r.provider)
    .filter((p) => p !== "email" && p !== "phone");

  return {
    email: emailRow?.email ?? null,
    phone: phoneRow?.phone ?? null,
    providers,
    createdAt: user.createdAt,
    preferredLocale: user.preferredLocale,
  };
}

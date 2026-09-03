import { deriveKey, seal, unseal } from "@/lib/crypto";
import { env } from "@/lib/env";

/** A sealed one-click token: proves the bearer may turn off one user's reminder
 *  emails, without a login and without being forgeable for another account. */
function key(): Buffer {
  return deriveKey(env().SESSION_SECRET, "reminders.unsubscribe");
}

export function signUnsubscribe(userId: string): string {
  return seal(key(), userId);
}

export function verifyUnsubscribe(token: string): string | null {
  return unseal(key(), token);
}

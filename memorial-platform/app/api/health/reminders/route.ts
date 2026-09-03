import { env } from "@/lib/env";
import { flags } from "@/lib/feature-flags";

/**
 * Reminder-system readiness probe. Two booleans about our own deploy, no
 * secrets: whether the reminder sweep is switched on, and whether a real mail
 * provider is configured to deliver it. Lets an operator confirm activation
 * without opening the Vercel dashboard. Runtime-only.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(): Promise<Response> {
  return Response.json(
    {
      remindersEnabled: flags().anniversaryNotificationsEnabled,
      emailConfigured: env().EMAIL_PROVIDER !== "console",
      emailProvider: env().EMAIL_PROVIDER,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

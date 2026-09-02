import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { flags } from "@/lib/feature-flags";
import { googleProvider } from "@/modules/auth/providers/google";
import { createOAuthState } from "@/modules/auth/providers/oauth";

const OAUTH_STATE_COOKIE = "oauth_state";

/**
 * A same-origin path we may redirect back to after login — never external.
 * Allows only a normal path + query (no protocol-relative `//`, no control
 * characters), so a crafted `next` cannot bounce the user off-site.
 */
export function safeNext(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  if (!/^\/[\w\-./%?=&:+@,~!$'()*;]*$/.test(raw)) return null;
  return raw.slice(0, 512);
}

export async function GET(request: Request): Promise<Response> {
  const config = env();

  if (!flags().oauthGoogleEnabled) {
    return NextResponse.redirect(new URL("/", config.APP_URL));
  }

  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") ?? "en";
  const next = safeNext(url.searchParams.get("next"));

  const { state, nonce } = createOAuthState();
  const provider = googleProvider();
  const authUrl = provider.createAuthorizationUrl({ state, nonce, locale });

  const response = NextResponse.redirect(authUrl);

  response.cookies.set({
    name: OAUTH_STATE_COOKIE,
    value: JSON.stringify({ state, nonce, locale, next }),
    httpOnly: true,
    secure: config.APP_URL.startsWith("https://"),
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return response;
}

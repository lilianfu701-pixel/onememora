import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { requestIpHash, userAgentFrom } from "@/lib/api";
import { env } from "@/lib/env";
import { flags } from "@/lib/feature-flags";
import { SUPPORTED_LOCALES } from "@/lib/locale";
import { setSessionCookie } from "@/modules/auth/cookies";
import { signInWithSocialProvider } from "@/modules/auth/oauth-service";
import { googleProvider } from "@/modules/auth/providers/google";
import { validateOAuthState } from "@/modules/auth/providers/oauth";
import { safeNext } from "../route";

const OAUTH_STATE_COOKIE = "oauth_state";

export async function GET(request: Request): Promise<Response> {
  const appUrl = env().APP_URL;

  if (!flags().oauthGoogleEnabled) {
    return NextResponse.redirect(new URL("/", appUrl));
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  if (errorParam || !code || !stateParam) {
    return NextResponse.redirect(new URL("/en/sign-in", appUrl));
  }

  const store = await cookies();
  const rawState = store.get(OAUTH_STATE_COOKIE)?.value;

  if (!rawState) {
    return NextResponse.redirect(new URL("/en/sign-in", appUrl));
  }

  let stored: {
    state: string;
    nonce: string;
    locale: string;
    next?: string | null;
  };
  try {
    stored = JSON.parse(rawState) as typeof stored;
  } catch {
    return NextResponse.redirect(new URL("/en/sign-in", appUrl));
  }

  const stateCheck = validateOAuthState({
    received: stateParam,
    expected: stored.state,
  });

  if (!stateCheck.ok) {
    return NextResponse.redirect(
      new URL(`/${stored.locale}/sign-in`, appUrl),
    );
  }

  try {
    const provider = googleProvider();
    const result = await provider.verifyCallback({
      code,
      state: stateParam,
      expectedState: stored.state,
      nonce: stored.nonce,
    });

    const session = await signInWithSocialProvider({
      provider: "google",
      providerSubject: result.providerSubject,
      email: result.email,
      emailVerified: result.emailVerified,
      locale: stored.locale,
      ipHash: requestIpHash(request),
      userAgent: userAgentFrom(request),
    });

    // Back to where they started (a memorial they were buying from, say). With
    // no explicit return path, fall back to the home page in the user's SAVED
    // language rather than the sign-in page's locale — a Chinese-preference
    // visitor whose browser defaulted the bare domain to /en should still land
    // on their own language after signing in.
    let localeForHome = stored.locale;
    try {
      const [row] = await db()
        .select({ preferredLocale: users.preferredLocale })
        .from(users)
        .where(eq(users.id, session.userId))
        .limit(1);
      const pref = row?.preferredLocale;
      if (pref && (SUPPORTED_LOCALES as readonly string[]).includes(pref)) {
        localeForHome = pref;
      }
    } catch {
      // Keep stored.locale on any lookup failure.
    }
    const dest = safeNext(stored.next ?? null) ?? `/${localeForHome}`;
    const response = NextResponse.redirect(new URL(dest, appUrl));

    response.cookies.set({
      name: OAUTH_STATE_COOKIE,
      value: "",
      httpOnly: true,
      secure: appUrl.startsWith("https://"),
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    // Remember the visitor's language so the bare-domain redirect (which
    // otherwise follows the browser's Accept-Language, often English) keeps
    // sending them to the language they just signed in with. next-intl reads
    // NEXT_LOCALE ahead of the header.
    const destSegment = dest.split("/")[1] ?? "";
    const destLocale = (SUPPORTED_LOCALES as readonly string[]).includes(
      destSegment,
    )
      ? destSegment
      : stored.locale;
    response.cookies.set({
      name: "NEXT_LOCALE",
      value: destLocale,
      secure: appUrl.startsWith("https://"),
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    return setSessionCookie(response, {
      token: session.token,
      expiresAt: session.expiresAt,
    });
  } catch {
    return NextResponse.redirect(
      new URL(`/${stored.locale}/sign-in`, appUrl),
    );
  }
}

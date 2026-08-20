import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import type { Metadata } from "next";
import { currentActor } from "@/modules/auth/current-user";
import { isProfileComplete, loadProfile } from "@/modules/identity/profile";
import { ProfileForm } from "./profile-form";
import { MentionPrompt } from "../mention-prompt";

export const dynamic = "force-dynamic";

/** A private account page — never indexed. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function ProfilePage(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale } = await props.params;
  const { next } = await props.searchParams;
  setRequestLocale(locale);

  const t = await getTranslations("profile");
  const nav = await getTranslations("nav");
  const actor = await currentActor();

  if (!actor.userId) {
    return (
      <main id="main" className="container section measure stack">
        <h1>{t("title")}</h1>
        <p className="lede">{t("signInFirst")}</p>
        <div>
          <Link
            className="button buttonPrimary"
            href={`/${locale}/sign-in?next=${encodeURIComponent(`/${locale}/profile`)}`}
          >
            {nav("signIn")}
          </Link>
        </div>
      </main>
    );
  }

  const profile = (await loadProfile(actor.userId)) ?? {
    fullName: null,
    gender: null,
    birthDate: null,
    birthplace: null,
    nameVisibility: null,
  };

  // Only follow a same-site next, and only once the profile is worth unlocking.
  const safeNext =
    next && next.startsWith(`/${locale}/`) ? next : null;

  return (
    <main id="main" className="container section stack-lg">
      <header className="stack measure">
        <h1>{t("title")}</h1>
        <p className="lede">
          {isProfileComplete(profile) ? t("intro") : t("gateBody")}
        </p>
      </header>

      <MentionPrompt
        userId={actor.userId}
        fullName={profile.fullName}
        locale={locale}
      />

      <ProfileForm initial={profile} next={safeNext} />
    </main>
  );
}

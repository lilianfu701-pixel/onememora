import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { currentActor } from "@/modules/auth/current-user";
import { ContactForm } from "./contact-form";

export const dynamic = "force-dynamic";

/** A contact form, not a page about anyone — keep it out of the index. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function ContactPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  const t = await getTranslations("support");
  const actor = await currentActor();
  const signInHref = `/${locale}/sign-in?next=${encodeURIComponent(
    `/${locale}/contact`,
  )}`;

  return (
    <main id="main" className="page measure stack">
      <h1>{t("title")}</h1>
      <p className="muted">{t("intro")}</p>
      <ContactForm signedIn={actor.userId !== null} signInHref={signInHref} />
    </main>
  );
}

import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import type { Metadata } from "next";
import { currentActor } from "@/modules/auth/current-user";
import { listInbox } from "@/modules/messaging/inbox";
import { InboxView } from "./inbox-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function InboxPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  const t = await getTranslations("inbox");
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
            href={`/${locale}/sign-in?next=${encodeURIComponent(`/${locale}/inbox`)}`}
          >
            {nav("signIn")}
          </Link>
        </div>
      </main>
    );
  }

  const messages = await listInbox(actor.userId);

  // Render each system message's body in the recipient's language. The template
  // key + params were stored when the message was sent; the Chinese `body` is a
  // fallback for old rows (or a key that has no translation).
  const sys = await getTranslations("sysmsg");
  const localized = messages.map((m) =>
    m.templateKey && sys.has(m.templateKey)
      ? { ...m, body: sys(m.templateKey, m.templateParams ?? {}) }
      : m,
  );

  return (
    <main id="main" className="container section stack">
      <header className="stack measure">
        <h1>{t("title")}</h1>
      </header>
      <InboxView locale={locale} initial={localized} />
    </main>
  );
}

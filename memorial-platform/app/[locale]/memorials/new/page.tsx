import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { currentActor } from "@/modules/auth/current-user";
import { CreateMemorialForm } from "./create-form";

export const dynamic = "force-dynamic";

/**
 * Creating a memorial.
 *
 * The sign-in check is on the server. Rendering the form to a signed-out
 * visitor and refusing at submit would mean someone types their mother's name
 * and dates, then loses them to a redirect.
 */
export default async function NewMemorialPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  const t = await getTranslations("memorial");
  const actor = await currentActor();

  // A signed-out visitor goes straight to sign-in — no intermediate landing —
  // and is carried back here afterwards. Someone who came to record a death
  // should not have to click through an extra page to get started.
  if (!actor.userId) {
    redirect(
      `/${locale}/sign-in?next=${encodeURIComponent(`/${locale}/memorials/new`)}`,
    );
  }

  return (
    <main id="main" className="container section stack-lg">
      <header className="stack measure">
        <h1>{t("createTitle")}</h1>
        <p className="lede">{t("relationshipHelp")}</p>
      </header>
      <CreateMemorialForm
        locale={locale}
        isAdmin={actor.platformRole !== "user"}
      />
    </main>
  );
}

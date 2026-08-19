import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { Suspense } from "react";
import { flags } from "@/lib/feature-flags";
import { currentActor } from "@/modules/auth/current-user";
import { HomeInscription } from "./home-inscription";
import { HomeSignIn } from "./home-sign-in";

/**
 * The same dedication, once per language: shown in its own script so the
 * promise "in every language" is demonstrated, not asserted. Doubles as the
 * language switcher.
 */
const languageGreetings = [
  { locale: "en", label: "English", text: "Every life deserves to be remembered." },
  { locale: "zh-CN", label: "简体中文", text: "每一个生命都值得被纪念。" },
  { locale: "zh-TW", label: "繁體中文", text: "每一個生命都值得被紀念。" },
  { locale: "zh-HK", label: "粵語", text: "每一個生命都值得被紀念。" },
  { locale: "es", label: "Español", text: "Cada vida merece ser recordada." },
  { locale: "pt-BR", label: "Português (BR)", text: "Toda vida merece ser lembrada." },
  { locale: "pt-PT", label: "Português (PT)", text: "Cada vida merece ser recordada." },
  { locale: "fr", label: "Français", text: "Chaque vie mérite qu’on s’en souvienne." },
  { locale: "de", label: "Deutsch", text: "Jedes Leben verdient es, in Erinnerung zu bleiben." },
  { locale: "ar", label: "العربية", text: "كل حياة تستحق أن تُذكر." },
  { locale: "ja", label: "日本語", text: "すべての命は、記憶される価値がある。" },
  { locale: "ru", label: "Русский", text: "Каждая жизнь достойна памяти." },
  { locale: "id", label: "Indonesia", text: "Setiap kehidupan layak untuk dikenang." },
  { locale: "vi", label: "Tiếng Việt", text: "Mỗi cuộc đời đều xứng đáng được tưởng nhớ." },
  { locale: "ko", label: "한국어", text: "모든 삶은 기억될 가치가 있습니다." },
];

const MOVEMENTS = [
  { numeral: "I", titleKey: "step1Title", descKey: "step1Desc" },
  { numeral: "II", titleKey: "step2Title", descKey: "step2Desc" },
  { numeral: "III", titleKey: "step3Title", descKey: "step3Desc" },
] as const;

export default async function HomePage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const actor = await currentActor();
  const { oauthGoogleEnabled } = flags();

  return (
    <main id="main" className="home">
      {/* Dedication */}
      <section className="homeHero">
        <div className="container homeHeroInner">
          <p className="homeLabel">{t("imLabel")}</p>
          <h1 className="homeDedication">{t("title")}</h1>

          <div className="homeInscription">
            <span className="homeInscriptionRule" aria-hidden="true" />
            <p className="homeKept">
              <span className="homeKeptLead">{t("keptLead")}</span>
              <span className="homeInscribed">
                <HomeInscription />
              </span>
            </p>
          </div>

          <p className="homeLede">{t("subtitle")}</p>

          <div className="homeActions">
            <Link className="homeCreate" href={`/${locale}/memorials/new`}>
              {t("createMemorial")}
            </Link>
            <Link className="homeFind" href={`/${locale}/search`}>
              {t("findMemorial")} →
            </Link>
          </div>

          <p className="homeReassure">{t("reassure")}</p>
        </div>
      </section>

      {/* How a life is held here */}
      <section className="homeSection">
        <div className="container">
          <h2 className="homeSectionTitle">{t("holdTitle")}</h2>
          <ol className="homeMovements">
            {MOVEMENTS.map((m) => (
              <li className="homeMovement" key={m.numeral}>
                <span className="homeMovementIndex" aria-hidden="true">
                  {m.numeral}
                </span>
                <div className="homeMovementBody">
                  <h3>{t(m.titleKey)}</h3>
                  <p>{t(m.descKey)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* In every language */}
      <section className="homeSection">
        <div className="container">
          <h2 className="homeSectionTitle">{t("languagesTitle")}</h2>
          <ul className="homeLangList">
            {languageGreetings.map((lang) => (
              <li key={lang.locale}>
                <Link
                  className="homeLang"
                  href={`/${lang.locale}`}
                  data-current={lang.locale === locale ? "true" : "false"}
                >
                  <span className="homeLangName">{lang.label}</span>
                  <span
                    className="homeLangLine"
                    lang={lang.locale}
                    dir={lang.locale === "ar" ? "rtl" : "ltr"}
                  >
                    {lang.text}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Closing dedication */}
      <section className="homeSection homeClose">
        <div className="container homeHeroInner">
          <p className="homeLabel">{t("imLabel")}</p>
          <h2 className="homeCloseTitle">{t("ctaTitle")}</h2>
          <p className="homeCloseLede">{t("ctaDesc")}</p>
          <Link className="homeCreate" href={`/${locale}/memorials/new`}>
            {t("createMemorial")}
          </Link>

          {!actor.userId ? (
            <Suspense>
              <HomeSignIn locale={locale} googleEnabled={oauthGoogleEnabled} />
            </Suspense>
          ) : null}
        </div>
      </section>
    </main>
  );
}

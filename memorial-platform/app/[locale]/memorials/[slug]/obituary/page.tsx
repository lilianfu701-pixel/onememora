import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { siteUrl } from "@/lib/env";
import { currentActor } from "@/modules/auth/current-user";
import { loadMemorialDetail } from "@/modules/memorials/detail";
import { getObituary } from "@/modules/memorials/obituary";
import { portraitsBySlug } from "@/modules/media/service";
import { memorialUrl } from "@/modules/memorials/seo";
import { ObituaryShare } from "./obituary-share";
import type { PosterData } from "./obituary-share";

export const dynamic = "force-dynamic";

function formatDate(
  date: string | null,
  precision: string,
  locale: string,
): string {
  if (!date || precision === "unknown") return "";
  const [y, m, d] = date.split("-");
  const cjk = locale.startsWith("zh") || locale === "ja" || locale === "ko";
  if (precision === "year") return cjk ? `${y}年` : `${y}`;
  if (precision === "month") return cjk ? `${y}年${Number(m)}月` : `${y}-${m}`;
  return cjk ? `${y}年${Number(m)}月${Number(d)}日` : `${y}-${m}-${d}`;
}

async function loadObituary(slug: string, locale: string) {
  const actor = await currentActor();
  const result = await loadMemorialDetail(slug, actor);
  if (!result.ok) return null;
  const { detail } = result;
  const obituary = await getObituary(detail.memorialId);
  if (!obituary || !obituary.published || !obituary.body) return null;

  const birth = formatDate(detail.birthDate, detail.birthDatePrecision, locale);
  const death = formatDate(detail.deathDate, detail.deathDatePrecision, locale);

  const portraits = await portraitsBySlug([detail.slug]);
  const portrait = portraits.get(detail.slug) ?? null;

  return { detail, obituary, birth, death, portrait };
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await props.params;
  const data = await loadObituary(slug, locale);
  const t = await getTranslations({ locale, namespace: "memorial" });
  if (!data) {
    return { title: t("obituaryTitle"), robots: { index: false } };
  }
  const title = `${t("obituaryTitle")}：${data.detail.primaryName}`;
  const description = data.obituary.body!.replace(/\s+/g, " ").slice(0, 140);
  // Only a stable (non-signed) portrait is safe to advertise to crawlers.
  const image =
    data.portrait && !data.portrait.includes("X-Amz-")
      ? data.portrait.startsWith("http")
        ? data.portrait
        : `${siteUrl()}${data.portrait}`
      : undefined;
  return {
    title,
    description,
    robots: { index: false, follow: true },
    openGraph: {
      title,
      description,
      type: "article",
      ...(image ? { images: [{ url: image }] } : {}),
    },
  };
}

export default async function ObituaryPage(props: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations("memorial");

  const data = await loadObituary(slug, locale);
  if (!data) notFound();
  const { detail, obituary, birth, death, portrait } = data;

  const life = birth && death ? `${birth} — ${death}` : birth || death;
  const pageUrl = memorialUrl({ appUrl: siteUrl(), locale, slug: detail.slug });

  // The plain-text version people paste into a chat or a WeChat post.
  const shareText = [
    `${t("obituaryTitle")}`,
    "",
    detail.primaryName,
    life,
    obituary.nativePlace
      ? `${t("obituaryNativePrefix")}${obituary.nativePlace}`
      : "",
    "",
    obituary.body,
    obituary.service ? `\n${obituary.service}` : "",
    obituary.survivors ? `\n${obituary.survivors}` : "",
    "",
    `${t("obituaryEnterMemorial")}：${pageUrl}`,
    detail.publicNumber
      ? t("obituaryNumberHint", { number: detail.publicNumber })
      : "",
  ]
    .filter((s) => s !== "")
    .join("\n");

  // Same-origin portraits (served through our media proxy) can be drawn onto
  // the poster canvas; a signed cross-origin URL would taint it, so skip it.
  const posterPortrait =
    portrait && portrait.includes("/api/media/public/") ? portrait : null;

  const poster: PosterData = {
    name: detail.primaryName,
    dates: life ?? "",
    nativePlace: obituary.nativePlace,
    body: obituary.body!,
    service: obituary.service,
    survivors: obituary.survivors,
    portraitUrl: posterPortrait,
    number: detail.publicNumber,
  };

  return (
    <main id="main" className="section">
      <div className="container measure obituaryPage">
        <article className="obituaryCard">
          <p className="obituaryKicker">{t("obituaryTitle")}</p>
          {portrait ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="obituaryPortrait"
              src={portrait}
              alt={detail.primaryName}
            />
          ) : null}
          <h1 className="obituaryName">{detail.primaryName}</h1>
          {life ? <p className="obituaryLife">{life}</p> : null}
          {obituary.nativePlace ? (
            <p className="obituaryMeta">
              {t("obituaryNativePrefix")}
              {obituary.nativePlace}
            </p>
          ) : null}

          <div className="obituaryBody">
            {obituary.body!.split(/\n{2,}/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {obituary.service ? (
            <p className="obituaryService">{obituary.service}</p>
          ) : null}
          {obituary.survivors ? (
            <p className="obituarySurvivors">{obituary.survivors}</p>
          ) : null}

          <Link className="button buttonQuiet obituaryEnter" href={pageUrl}>
            {t("obituaryEnterMemorial")} →
          </Link>
        </article>

        <ObituaryShare
          memorialUrl={pageUrl}
          shareText={shareText}
          poster={poster}
        />
      </div>
    </main>
  );
}

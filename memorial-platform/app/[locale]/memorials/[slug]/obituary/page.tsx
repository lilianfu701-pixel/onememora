import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { deceasedPeople, memorials } from "@/db/schema";
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

/** Fetches an image and inlines it as a data URL (same-origin, canvas-safe). */
async function toDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const type = res.headers.get("content-type") || "image/webp";
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
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

  // Gender drives the poster's 先生 / 女士 honorific.
  const [gp] = await db()
    .select({ gender: deceasedPeople.gender })
    .from(memorials)
    .innerJoin(deceasedPeople, eq(deceasedPeople.id, memorials.deceasedPersonId))
    .where(eq(memorials.id, detail.memorialId));
  const gender: "male" | "female" | null =
    gp?.gender === "male" || gp?.gender === "female" ? gp.gender : null;

  return { detail, obituary, birth, death, portrait, gender };
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
  const { detail, obituary, birth, death, portrait, gender } = data;

  const life = birth && death ? `${birth} — ${death}` : birth || death;
  const pageUrl = memorialUrl({ appUrl: siteUrl(), locale, slug: detail.slug });

  // The plain-text version people paste into a chat or a WeChat post.
  const shareText = [
    `${t("obituaryTitle")}`,
    "",
    detail.primaryName,
    life,
    obituary.age ? t("obituaryAgeShown", { age: obituary.age }) : "",
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

  // The poster canvas cannot draw a cross-origin (signed) portrait without
  // tainting and failing to export. Inline the portrait as a data URL instead,
  // so it works even while the memorial is still a private draft.
  const posterPortrait = portrait ? await toDataUrl(portrait) : null;

  const poster: PosterData = {
    name: detail.primaryName,
    birth: birth || null,
    death: death || null,
    age: obituary.age,
    gender,
    body: obituary.body!,
    service: obituary.service,
    survivors: obituary.survivors,
    portraitUrl: posterPortrait,
    number: detail.publicNumber,
  };

  return (
    <main id="main" className="section">
      <div className="container measure obituaryPage stack">
        {/* The published poster leads; the person's name is the page heading for
         * screen readers and accessibility. */}
        <h1 className="obituaryKicker">
          {t("obituaryTitle")}
          <span className="srOnly">：{detail.primaryName}</span>
        </h1>

        <ObituaryShare
          memorialUrl={pageUrl}
          shareText={shareText}
          poster={poster}
        />
      </div>
    </main>
  );
}

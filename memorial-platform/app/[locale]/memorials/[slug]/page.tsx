import { and, asc, eq } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import type { Metadata } from "next";
import { db } from "@/db/client";
import {
  memorialBookmarks,
  memorialLocations,
  memorialRelatives,
  users,
} from "@/db/schema";
import { countryName } from "@/lib/countries";
import { env, siteUrl } from "@/lib/env";
import { currentActor } from "@/modules/auth/current-user";
import {
  publicVisitorStories,
  publishedBiography,
} from "@/modules/memorials/content-service";
import { lifeSpan, loadMemorialDetail } from "@/modules/memorials/detail";
import { portraitsBySlug } from "@/modules/media/service";
import { avatarsForRelativeNames } from "@/modules/identity/avatar";
import { memorialUrl, robotsFor } from "@/modules/memorials/seo";
import { offeringSummary } from "@/modules/offerings/display";
import { listPublicChapters } from "@/modules/memorials/life-chapters";
import { getDisposition } from "@/modules/memorials/disposition";
import { DispositionCard } from "./disposition-card";
import { DEFAULT_LOCALE, LAUNCH_LOCALES } from "@/lib/locale";
import { BreadcrumbJsonLd, MemorialJsonLd } from "./memorial-jsonld";
import { familyViewForMemorial } from "@/modules/genealogy/family-view";
import { BookmarkButton } from "./bookmark-button";
import { ContactManager } from "./contact-manager";
import { FamilyTree } from "./family-tree";
import { Guestbook } from "./guestbook";
import { OfferingsAltar } from "./offerings-altar";
import { LifeChapters } from "./life-chapters";
import { Contributions } from "./contributions";
import {
  contributorStanding,
  listPublicContributions,
} from "@/modules/memorials/contributions";
import { PublishPanel } from "./publish-panel";
import { Share } from "./share";

/*
 * The creator declared the deceased's relationship to *them* ("the deceased is
 * your father/son/…"). The public line reads the other way — the creator's
 * relationship to the deceased — so each declared role maps to its inverse.
 * Genderless where the inverse is ambiguous (a father's memorial is kept by a
 * "child", not necessarily a son). No name is shown, only the relationship.
 */
export const dynamic = "force-dynamic";

/*
 * Memoized for the request. `generateMetadata` and the page body both need the
 * memorial, and without this the access check and the read would run twice for
 * every visit.
 */
const load = cache(async (slug: string) => {
  const actor = await currentActor();
  return loadMemorialDetail(slug, actor);
});

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await props.params;
  const result = await load(slug);

  // A denied page gets no title of its own. Putting the name in the tab, or in
  // an OpenGraph card, would publish the fact the family withheld — the page
  // body refuses correctly and the metadata would leak around it.
  if (!result.ok) {
    return { robots: { index: false, follow: false } };
  }

  const { detail } = result;
  // The real status, not an assumed one: a draft is visible to its owner, and
  // an owner's browser is as capable of being a crawler's referrer as anyone's.
  const robots = robotsFor({
    slug: detail.slug,
    visibility: detail.visibility,
    status: detail.status,
    searchEngineIndexable: detail.searchEngineIndexable,
    availableLocales: [locale],
  });

  const span = lifeSpan(detail);
  // Bare years in the title. The approximation marker belongs to page copy,
  // and a browser tab is not the place to explain it.
  const years = [span.birth?.year, span.death?.year].filter(Boolean).join(" – ");

  const appUrl = env().APP_URL;
  const indexable =
    detail.visibility === "public" &&
    detail.status === "published" &&
    detail.searchEngineIndexable;

  // Only advertise translations for a page Google may index; a private or
  // noindex page has no business linking language variants.
  const languages = indexable
    ? {
        ...Object.fromEntries(
          LAUNCH_LOCALES.map((l) => [
            l,
            memorialUrl({ appUrl, locale: l, slug: detail.slug }),
          ]),
        ),
        "x-default": memorialUrl({
          appUrl,
          locale: DEFAULT_LOCALE,
          slug: detail.slug,
        }),
      }
    : undefined;

  const title = years
    ? `${detail.primaryName} (${years})`
    : detail.primaryName;

  // The portrait, for social share cards (WeChat / X / Facebook). Only for a
  // page that may be indexed/shared.
  let ogImage: string | undefined;
  if (indexable) {
    const portraits = await portraitsBySlug([detail.slug]);
    const portrait = portraits.get(detail.slug);
    // Skip a short-lived signed URL; it would expire before a share/crawl fetch.
    if (portrait && !portrait.includes("X-Amz-")) {
      ogImage = portrait.startsWith("http") ? portrait : `${appUrl}${portrait}`;
    }
  }

  return {
    title,
    robots,
    alternates: {
      canonical: memorialUrl({ appUrl, locale, slug: detail.slug }),
      ...(languages ? { languages } : {}),
    },
    openGraph: {
      title,
      type: "profile",
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
  };
}

export default async function MemorialPage(props: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await props.params;
  setRequestLocale(locale);

  const t = await getTranslations("memorial");
  const nav = await getTranslations("nav");
  const result = await load(slug);

  if (!result.ok) {
    if (result.reason === "MERGED") {
      // A link a family put in a death notice years ago has to keep working.
      if (result.redirectSlug) {
        redirect(`/${locale}/memorials/${result.redirectSlug}`);
      }
      notFound();
    }

    if (result.reason === "INVITATION_REQUIRED") {
      return (
        <main id="main" className="container section measure stack">
          <h1>{t("invitationRequiredTitle")}</h1>
          <p className="lede">{t("invitationRequiredBody")}</p>
        </main>
      );
    }

    if (result.reason === "GONE") {
      return (
        <main id="main" className="container section measure stack">
          <h1>{t("unavailableTitle")}</h1>
          <p className="lede">{t("unavailableBody")}</p>
        </main>
      );
    }

    // NOT_FOUND and FORBIDDEN are both a 404. Answering 403 would confirm that
    // a memorial for a named person exists here, which is the one fact an
    // invite-only family chose to keep.
    notFound();
  }

  const { detail } = result;
  const span = lifeSpan(detail);

  // Dates shown to the precision the family actually recorded: a full date to
  // the day when known, otherwise the year — never a placeholder day.
  const fullDate = (
    value: string | null,
    precision: (typeof detail)["birthDatePrecision"],
  ): string | null => {
    if (!value || precision === "unknown") return null;
    if (precision === "year" || precision === "approximate") {
      return value.slice(0, 4);
    }
    const dt = new Date(`${value}T00:00:00`);
    if (Number.isNaN(dt.getTime())) return value.slice(0, 4);
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      ...(precision === "day" ? { day: "numeric" } : {}),
    }).format(dt);
  };
  const birthText = fullDate(detail.birthDate, detail.birthDatePrecision);
  const deathText = fullDate(detail.deathDate, detail.deathDatePrecision);

  // A member of this memorial: sees family-scoped messages and moderates.
  const isFamily =
    detail.viewerRole !== "public_visitor" &&
    detail.viewerRole !== "invited_visitor";
  const viewer = await currentActor();

  const [
    biography,
    stories,
    relatives,
    locations,
    offerings,
    chapters,
    contributions,
  ] = await Promise.all([
      publishedBiography(detail.memorialId),
      publicVisitorStories(detail.memorialId, {
        userId: viewer.userId,
        isFamily,
      }),
      db()
        .select({
          id: memorialRelatives.id,
          name: memorialRelatives.name,
          relationshipToDeceased: memorialRelatives.relationshipToDeceased,
          isDeceased: memorialRelatives.isDeceased,
          showFullName: memorialRelatives.showFullName,
          nameVisibility: memorialRelatives.nameVisibility,
          displayOrder: memorialRelatives.displayOrder,
          coParentId: memorialRelatives.coParentId,
          spouseOfId: memorialRelatives.spouseOfId,
        })
        .from(memorialRelatives)
        .where(eq(memorialRelatives.memorialId, detail.memorialId))
        .orderBy(asc(memorialRelatives.displayOrder)),
      db()
        .select({
          kind: memorialLocations.kind,
          country: memorialLocations.country,
          region: memorialLocations.region,
        })
        .from(memorialLocations)
        .where(eq(memorialLocations.memorialId, detail.memorialId)),
      offeringSummary(detail.memorialId),
      listPublicChapters(detail.memorialId),
      listPublicContributions(detail.memorialId),
    ]);

  const disposition = await getDisposition(detail.memorialId);

  // The family tree, assembled from the registered relatives and any confirmed
  // links to other memorials. A year is only used when the date is real, not a
  // placeholder standing in for an unknown precision.
  const rootYear = (
    date: string | null,
    precision: (typeof detail)["birthDatePrecision"],
  ): number | null =>
    date && precision !== "unknown" ? Number.parseInt(date.slice(0, 4), 10) : null;
  // The page shows three generations — parents, this person's own, children.
  // Grandparents and beyond live on the full genealogy view.
  const compactRelatives = relatives.filter(
    (r) => !r.relationshipToDeceased.includes("grand"),
  );
  const familyView = await familyViewForMemorial(
    detail.memorialId,
    {
      name: detail.primaryName,
      birthYear: rootYear(detail.birthDate, detail.birthDatePrecision),
      deathYear: rootYear(detail.deathDate, detail.deathDatePrecision),
    },
    compactRelatives,
    { viewerLoggedIn: viewer.userId !== null, hiddenLabel: t("nameHiddenPlaceholder") },
  );

  // Portraits for relatives who have their own memorial, so the family chart
  // shows faces rather than initials.
  const treePortraits = familyView
    ? await portraitsBySlug([
        // The root's own slug is not carried in the tree, so add it here.
        detail.slug,
        ...familyView.tree.nodes
          .map((node) => ("memorialSlug" in node ? node.memorialSlug : null))
          .filter((slug): slug is string => Boolean(slug)),
      ])
    : new Map<string, string>();
  const rootPortrait = treePortraits.get(detail.slug) ?? null;

  // A living relative who claimed their place and chose to appear shows their
  // own photograph, keyed by the name the memorial lists them under.
  const treeAvatars = familyView
    ? await avatarsForRelativeNames(detail.memorialId)
    : new Map<string, string>();

  // Whether this viewer is a verified friend/relative, so the contribution
  // form can invite them to post without review.
  const viewerStanding = await contributorStanding(
    viewer.userId,
    detail.memorialId,
  );

  // Whether this viewer has already kept this memorial.
  const viewerBookmarked = viewer.userId
    ? (
        await db()
          .select({ memorialId: memorialBookmarks.memorialId })
          .from(memorialBookmarks)
          .where(
            and(
              eq(memorialBookmarks.userId, viewer.userId),
              eq(memorialBookmarks.memorialId, detail.memorialId),
            ),
          )
      ).length > 0
    : false;

  // The signed-in visitor's own name, so lighting a candle can default to it.
  const viewerName = viewer.userId
    ? ((
        await db()
          .select({
            displayName: users.displayName,
            fullName: users.fullName,
          })
          .from(users)
          .where(eq(users.id, viewer.userId))
      )[0] ?? null)
    : null;
  const viewerDisplayName =
    viewerName?.displayName?.trim() || viewerName?.fullName?.trim() || null;

  const formatPlace = (loc: { country: string | null; region: string | null }) =>
    [loc.region, loc.country ? countryName(loc.country, locale) : ""]
      .map((part) => part?.trim())
      .filter((part) => part && part.length > 0)
      .join(" · ");

  const birthPlace = locations.find((loc) => loc.kind === "birth");
  const deathPlace = locations.find((loc) => loc.kind === "death");
  const birthPlaceText = birthPlace ? formatPlace(birthPlace) : "";
  const deathPlaceText = deathPlace ? formatPlace(deathPlace) : "";

  const canManage = isFamily;
  const showOwnerBar =
    detail.status === "draft" ||
    (detail.status === "published" && detail.visibility === "unlisted");

  // Structured data only for a page Google may index.
  const indexable =
    detail.visibility === "public" &&
    detail.status === "published" &&
    detail.searchEngineIndexable;
  const schemaDate = (
    value: string | null,
    precision: string,
  ): string | null => {
    if (!value || precision === "unknown") return null;
    if (precision === "day") return value.slice(0, 10);
    if (precision === "month") return value.slice(0, 7);
    return value.slice(0, 4);
  };
  // A short-lived signed URL (contains an AWS query signature) would 403 by the
  // time a crawler or social platform fetches it — only advertise a stable URL.
  const stablePortrait =
    rootPortrait && !rootPortrait.includes("X-Amz-") ? rootPortrait : null;
  const schemaImage = stablePortrait
    ? stablePortrait.startsWith("http")
      ? stablePortrait
      : `${siteUrl()}${stablePortrait}`
    : null;
  const schemaDescription = biography?.body
    ? biography.body.replace(/\s+/g, " ").trim().slice(0, 300)
    : null;

  return (
    <main id="main">
      {indexable ? (
        <>
          <MemorialJsonLd
            url={memorialUrl({ appUrl: siteUrl(), locale, slug: detail.slug })}
            name={detail.primaryName}
            image={schemaImage}
            description={schemaDescription}
            birthDate={schemaDate(detail.birthDate, detail.birthDatePrecision)}
            deathDate={schemaDate(detail.deathDate, detail.deathDatePrecision)}
            birthPlace={birthPlaceText || null}
            deathPlace={deathPlaceText || null}
          />
          <BreadcrumbJsonLd
            items={[
              { name: nav("home"), url: `${siteUrl()}/${locale}` },
              { name: nav("search"), url: `${siteUrl()}/${locale}/search` },
              {
                name: detail.primaryName,
                url: memorialUrl({ appUrl: siteUrl(), locale, slug: detail.slug }),
              },
            ]}
          />
        </>
      ) : null}
      <article className="container section memorialView">
        {showOwnerBar ? (
          <div className="memorialOwnerBar">
            {/*
             * A draft is only ever reachable by the family, so this panel does
             * not need its own permission check — but publishing does, and the
             * endpoint it posts to keeps that with the owner.
             */}
            {detail.status === "draft" ? (
              <PublishPanel
                memorialId={detail.memorialId}
                willBeIndexed={
                  detail.visibility === "public" &&
                  detail.searchEngineIndexable
                }
              />
            ) : null}

            {detail.status === "published" &&
            detail.visibility === "unlisted" ? (
              <p className="notice">{t("privateNotice")}</p>
            ) : null}
          </div>
        ) : null}

        {/* The altar leads the page: the portrait, flanked by wreaths, with the
         * censer and candles below. The deceased's details follow beneath it. */}
        <OfferingsAltar
          memorialId={detail.memorialId}
          summary={offerings}
          isLoggedIn={viewer.userId !== null}
          locale={locale}
          viewerName={viewerDisplayName}
          portrait={rootPortrait}
          personName={detail.primaryName}
          paymentEnabled={Boolean(
            process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET,
          )}
          details={
            <header className="memorialHead">
          {/* Name and the names the person was known by, on one line. */}
          <p className="memorialNames">
            <span className="memorialName">{detail.primaryName}</span>
            {detail.alternateNames.map((name, index) => (
              <span key={`${name.type}-${index}`} className="memorialAlias">
                <span className="memorialAliasType">
                  {t(`nameType_${name.type}`)}
                </span>
                {name.value}
              </span>
            ))}
          </p>

          {/* Birth and death, side by side. */}
          <div className="memorialLifeline memorialLifelineRow">
            {birthText ? (
              <p className="memorialLifelineEntry">
                <span className="memorialLifelineMarker" aria-hidden="true">★</span>
                {span.birth?.approximate
                  ? t("approximateYear", { year: birthText })
                  : birthText}
                {birthPlaceText ? (
                  <span className="memorialLifelinePlace">
                    {t("bornIn", { place: birthPlaceText })}
                  </span>
                ) : null}
              </p>
            ) : null}
            {deathText ? (
              <p className="memorialLifelineEntry">
                <span className="memorialLifelineMarker" aria-hidden="true">†</span>
                {span.death?.approximate
                  ? t("approximateYear", { year: deathText })
                  : deathText}
                {deathPlaceText ? (
                  <span className="memorialLifelinePlace">
                    {t("diedIn", { place: deathPlaceText })}
                  </span>
                ) : null}
              </p>
            ) : null}
          </div>

          {/* Three functions: contact the manager, bookmark, share. The contact
           * button is hidden for a manager — you cannot message yourself. */}
          <div className="memorialActions">
            {!canManage ? (
              <ContactManager
                memorialId={detail.memorialId}
                label={t("contactManager")}
                signedIn={viewer.userId !== null}
                signInHref={`/${locale}/sign-in?next=${encodeURIComponent(`/${locale}/memorials/${detail.slug}`)}`}
              />
            ) : null}
            {viewer.userId ? (
              <BookmarkButton
                memorialId={detail.memorialId}
                initialBookmarked={viewerBookmarked}
              />
            ) : null}
            <Share
              url={memorialUrl({
                appUrl: env().APP_URL,
                locale,
                slug: detail.slug,
              })}
              title={detail.primaryName}
            />
          </div>
          {detail.publicNumber ? (
            <p className="memorialNumber">
              {t("memorialNumberLabel")}
              <span className="memorialNumberValue">{detail.publicNumber}</span>
            </p>
          ) : null}
            </header>
          }
        />

        <div className="memorialGrid">
          <div className="memorialMain">
            <section className="stack">
              <h2>{t("lifeStory")}</h2>
              {biography ? (
                <div className="stack">
                  {biography.title ? <h3>{biography.title}</h3> : null}
                  {/*
                   * Split into paragraphs rather than injected as markup. A
                   * family writes prose here, and nothing a visitor or an
                   * editor typed may become HTML on a page other people open.
                   */}
                  {biography.body
                    .split(/\n{2,}/)
                    .map((paragraph) => paragraph.trim())
                    .filter((paragraph) => paragraph.length > 0)
                    .map((paragraph, index) => (
                      <p key={`${biography.versionId}-${index}`}>
                        {paragraph}
                      </p>
                    ))}
                </div>
              ) : (
                <p className="muted">{t("noLifeStoryYet")}</p>
              )}
            </section>

            <LifeChapters locale={locale} chapters={chapters} />

            {disposition?.method ? (
              <DispositionCard
                heading={t("dispositionHeading")}
                method={t(`disp_${disposition.method}`)}
                place={disposition.place}
                placeLabel={t("dispositionPlaceLabel")}
                date={disposition.date}
                dateLabel={t("dispositionDateLabel")}
                note={disposition.note}
                lng={disposition.lng}
                lat={disposition.lat}
                photoUrl={disposition.photoUrl}
              />
            ) : null}

            <Contributions
              memorialId={detail.memorialId}
              locale={locale}
              initial={contributions}
              chapters={chapters.map((chapter) => ({
                id: chapter.id,
                chapterKey: chapter.chapterKey,
                customTitle: chapter.customTitle,
              }))}
              viewer={{
                verified: viewerStanding.verified,
                name: viewerStanding.name,
                relation: viewerStanding.relation,
              }}
            />

            {familyView ? (
              <FamilyTree
                tree={familyView.tree}
                locale={locale}
                heading={t("familyTreeHeading")}
                kinship={familyView.kinship}
                statusLiving={t("statusLiving")}
                statusDeceased={t("statusDeceased")}
                portraits={treePortraits}
                avatarsByName={treeAvatars}
                rootPortrait={rootPortrait}
              />
            ) : null}

            {familyView ? (
              <p>
                <Link
                  className="button buttonQuiet buttonCompact"
                  href={`/${locale}/memorials/${detail.slug}/family`}
                >
                  {t("fullTreeLink")} →
                </Link>
              </p>
            ) : null}

            <Guestbook
              memorialId={detail.memorialId}
              locale={locale}
              initial={stories}
              canModerate={canManage}
              isLoggedIn={viewer.userId !== null}
            />
          </div>
        </div>

        {/* Owner-only manage link, moved to the foot so the top stays compact. */}
        {canManage ? (
          <div className="memorialManageFoot">
            <Link
              className="memorialManageLink"
              href={`/${locale}/memorials/${detail.slug}/manage`}
            >
              {t("manageLink")}
            </Link>
          </div>
        ) : null}
      </article>
    </main>
  );
}

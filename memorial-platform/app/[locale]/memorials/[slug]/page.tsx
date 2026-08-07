import { asc, eq } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import type { Metadata } from "next";
import { db } from "@/db/client";
import {
  memorialLocations,
  memorialRelatives,
  relationshipClaims,
} from "@/db/schema";
import { countryName } from "@/lib/countries";
import { env } from "@/lib/env";
import { normalizeLocale } from "@/lib/locale";
import { currentActor } from "@/modules/auth/current-user";
import {
  publicVisitorStories,
  publishedBiography,
} from "@/modules/memorials/content-service";
import { lifeSpan, loadMemorialDetail } from "@/modules/memorials/detail";
import { memorialGallery } from "@/modules/media/service";
import { memorialUrl, robotsFor } from "@/modules/memorials/seo";
import { offerableRituals } from "@/modules/religion/memorial-settings";
import { OfferRitual } from "./offer-ritual";
import { PhotoSlideshow } from "./photo-slideshow";
import { PublishPanel } from "./publish-panel";

function desensitizeName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length <= 1) return trimmed;
  const chars = [...trimmed];
  if (chars.length === 2) return chars[0] + "*";
  return chars[0] + "*".repeat(chars.length - 2) + chars[chars.length - 1];
}

/*
 * The creator declared the deceased's relationship to *them* ("the deceased is
 * your father/son/…"). The public line reads the other way — the creator's
 * relationship to the deceased — so each declared role maps to its inverse.
 * Genderless where the inverse is ambiguous (a father's memorial is kept by a
 * "child", not necessarily a son). No name is shown, only the relationship.
 */
/*
 * The order relatives are listed in, regardless of entry order: spouse first,
 * then parents, then children, then the rest. A memorial reads as a family when
 * the closest bonds lead.
 */
const RELATIVE_ORDER: readonly string[] = [
  "husband",
  "wife",
  "father",
  "mother",
  "son",
  "daughter",
  "paternal_grandfather",
  "paternal_grandmother",
  "maternal_grandfather",
  "maternal_grandmother",
  "older_brother",
  "older_sister",
  "younger_brother",
  "younger_sister",
  "ex_husband",
  "ex_wife",
];

function relativeRank(relationship: string): number {
  const index = RELATIVE_ORDER.indexOf(relationship);
  return index === -1 ? RELATIVE_ORDER.length : index;
}

const CREATOR_ROLE: Record<string, string> = {
  husband: "wife",
  wife: "husband",
  spouse: "spouse",
  father: "child",
  mother: "child",
  parent: "child",
  son: "parent",
  daughter: "parent",
  child: "parent",
  paternal_grandfather: "grandchild",
  paternal_grandmother: "grandchild",
  maternal_grandfather: "grandchild",
  maternal_grandmother: "grandchild",
  sibling: "sibling",
};

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

  return {
    title: years ? `${detail.primaryName} (${years})` : detail.primaryName,
    robots,
    alternates: {
      canonical: memorialUrl({
        appUrl: env().APP_URL,
        locale,
        slug: detail.slug,
      }),
    },
  };
}

export default async function MemorialPage(props: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await props.params;
  setRequestLocale(locale);

  const t = await getTranslations("memorial");
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

  const [
    biography,
    stories,
    rituals,
    gallery,
    relatives,
    creatorClaim,
    locations,
  ] = await Promise.all([
      publishedBiography(detail.memorialId),
      publicVisitorStories(detail.memorialId),
      offerableRituals(detail.memorialId, normalizeLocale(locale)),
      memorialGallery(detail.memorialId),
      db()
        .select({
          id: memorialRelatives.id,
          name: memorialRelatives.name,
          relationshipToDeceased: memorialRelatives.relationshipToDeceased,
          isDeceased: memorialRelatives.isDeceased,
          showFullName: memorialRelatives.showFullName,
          displayOrder: memorialRelatives.displayOrder,
        })
        .from(memorialRelatives)
        .where(eq(memorialRelatives.memorialId, detail.memorialId)),
      // The creator's original declaration — the earliest claim on this
      // memorial. Only the relationship is read; the claimant is never shown.
      db()
        .select({ relationship: relationshipClaims.relationship })
        .from(relationshipClaims)
        .where(eq(relationshipClaims.memorialId, detail.memorialId))
        .orderBy(asc(relationshipClaims.createdAt))
        .limit(1),
      db()
        .select({
          kind: memorialLocations.kind,
          country: memorialLocations.country,
          region: memorialLocations.region,
        })
        .from(memorialLocations)
        .where(eq(memorialLocations.memorialId, detail.memorialId)),
    ]);

  const creatorRoleKey = creatorClaim[0]
    ? CREATOR_ROLE[creatorClaim[0].relationship]
    : undefined;

  // Fixed family order: spouse, parents, children, then the rest.
  const orderedRelatives = [...relatives].sort(
    (a, b) =>
      relativeRank(a.relationshipToDeceased) -
        relativeRank(b.relationshipToDeceased) ||
      a.displayOrder - b.displayOrder,
  );

  const formatPlace = (loc: { country: string | null; region: string | null }) =>
    [loc.region, loc.country ? countryName(loc.country, locale) : ""]
      .map((part) => part?.trim())
      .filter((part) => part && part.length > 0)
      .join(" · ");

  const birthPlace = locations.find((loc) => loc.kind === "birth");
  const deathPlace = locations.find((loc) => loc.kind === "death");
  const birthPlaceText = birthPlace ? formatPlace(birthPlace) : "";
  const deathPlaceText = deathPlace ? formatPlace(deathPlace) : "";

  /*
   * An observance with no reviewed wording in this language is not offered.
   * Better to show one fewer control than to put an English ritual name on a
   * page a family is reading in their own language.
   */
  const offerable = rituals.filter((ritual) => ritual.name !== null);

  const slides = gallery.map((photo) => ({
    id: photo.id,
    url: photo.url,
    alt: photo.altText ?? t("photoAltOf", { name: detail.primaryName }),
  }));

  const showOwnerBar =
    (detail.viewerRole !== "public_visitor" &&
      detail.viewerRole !== "invited_visitor") ||
    detail.status === "draft" ||
    (detail.status === "published" && detail.visibility === "unlisted");

  return (
    <main id="main">
      <article className="container section memorialView">
        {showOwnerBar ? (
          <div className="memorialOwnerBar">
            {/*
             * Offered only to someone who can act on it. A visitor seeing a
             * "manage" link they cannot use would be told the family's roles
             * exist, and would waste a click finding out they are not one.
             */}
            {detail.viewerRole !== "public_visitor" &&
            detail.viewerRole !== "invited_visitor" ? (
              <Link
                className="button buttonQuiet buttonCompact"
                href={`/${locale}/memorials/${detail.slug}/manage`}
              >
                {t("manageLink")}
              </Link>
            ) : null}

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

        {/* Photographs lead the page, as a slideshow. */}
        <PhotoSlideshow
          photos={slides}
          prevLabel={t("photoPrevious")}
          nextLabel={t("photoNext")}
        />

        <header className="memorialHead">
          <h1 className="memorialName">{detail.primaryName}</h1>

          {span.birth || span.death ? (
            <p className="memorialDates">
              {span.birth ? (
                <span>
                  <span className="visuallyHidden">{t("bornLabel")} </span>
                  {span.birth.approximate
                    ? t("approximateYear", { year: span.birth.year })
                    : span.birth.year}
                </span>
              ) : null}
              {span.birth && span.death ? " – " : null}
              {span.death ? (
                <span>
                  <span className="visuallyHidden">{t("diedLabel")} </span>
                  {span.death.approximate
                    ? t("approximateYear", { year: span.death.year })
                    : span.death.year}
                </span>
              ) : null}
            </p>
          ) : null}

          {birthPlaceText ? (
            <p className="memorialAka">
              <span className="eyebrow">{t("birthPlaceLabel")}</span>{" "}
              {birthPlaceText}
            </p>
          ) : null}

          {deathPlaceText ? (
            <p className="memorialAka">
              <span className="eyebrow">{t("deathPlaceLabel")}</span>{" "}
              {deathPlaceText}
            </p>
          ) : null}

          {/*
           * Each recorded name is labelled with the exact kind it was entered
           * as — former name, alias, transliteration, native — never a generic
           * "also known as".
           */}
          {detail.alternateNames.map((name, index) => (
            <p className="memorialAka" key={`${name.type}-${index}`}>
              <span className="eyebrow">{t(`nameType_${name.type}`)}</span>{" "}
              {name.value}
            </p>
          ))}

          {creatorRoleKey ? (
            <p className="memorialCreator">
              {t("createdByRelative", {
                relation: t(`creatorRole_${creatorRoleKey}`),
              })}
            </p>
          ) : null}
        </header>

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

            <section className="stack">
              <h2>{t("waysToRemember")}</h2>
              {offerable.length > 0 ? (
                <OfferRitual
                  memorialId={detail.memorialId}
                  locale={normalizeLocale(locale)}
                  rituals={offerable.map((ritual) => ({
                    ritualVersionId: ritual.ritualVersionId,
                    name: ritual.name,
                    allowAnonymous: ritual.allowAnonymous,
                    allowMessage: ritual.allowMessage,
                    moderationMode: ritual.moderationMode,
                  }))}
                />
              ) : (
                <p className="muted">{t("noRitualsOffered")}</p>
              )}
            </section>

            {stories.length > 0 ? (
              <section className="stack">
                <h2>{t("storiesFromVisitors")}</h2>
                {stories.map((story) => (
                  <div className="card stack" key={story.id}>
                    {story.title ? <h3>{story.title}</h3> : null}
                    <p>{story.body}</p>
                  </div>
                ))}
              </section>
            ) : null}
          </div>

          {orderedRelatives.length > 0 ? (
            <aside className="memorialAside">
              <h2 className="memorialAsideHeading">{t("relativesLabel")}</h2>
              <ul className="relativesSidebar">
                {orderedRelatives.map((rel) => (
                  <li key={rel.id}>
                    <span className="relativesSidebarRole">
                      {t(`relativeRole_${rel.relationshipToDeceased}`)}
                    </span>
                    <span className="relativesSidebarName">
                      {rel.showFullName ? rel.name : desensitizeName(rel.name)}
                      <span
                        className={
                          rel.isDeceased
                            ? "relativesSidebarStatus relativesSidebarStatusDeceased"
                            : "relativesSidebarStatus"
                        }
                      >
                        {rel.isDeceased ? t("statusDeceased") : t("statusLiving")}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
        </div>
      </article>
    </main>
  );
}

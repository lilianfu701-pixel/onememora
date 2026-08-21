import { and, asc, desc, eq, isNull, ne } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/db/client";
import {
  memorialMembers,
  memorialNames,
  memorialRelatives,
  memorials,
} from "@/db/schema";
import { memorialFamilyLinks } from "@/modules/genealogy/memorial-graph";
import { normalizeLocale } from "@/lib/locale";
import { currentActor } from "@/modules/auth/current-user";
import {
  latestBiographyDraft,
  publishedBiography,
} from "@/modules/memorials/content-service";
import { loadMemorialDetail } from "@/modules/memorials/detail";
import { manageableMedia } from "@/modules/media/service";
import { canOnMemorial } from "@/modules/permissions/policy";
import { listPendingClaims } from "@/modules/memorials/recognition";
import { ritualChoices } from "@/modules/religion/memorial-settings";
import { ManageForms } from "./manage-forms";
import { PhotoManager } from "./photo-manager";
import { FamilyEditor } from "./family-editor";
import { PrivacyEditor } from "./privacy-editor";
import { RelativesEditor } from "./relatives-editor";
import { RecognitionReview } from "./recognition-review";
import { DonationsPanel } from "./donations-panel";
import { listDonations } from "@/modules/offerings/donations";
import { ChaptersEditor } from "./chapters-editor";
import { listManageChapters } from "@/modules/memorials/life-chapters";
import { ContributionsReview } from "./contributions-review";
import { listPendingContributions } from "@/modules/memorials/contributions";

export const dynamic = "force-dynamic";

/** Never indexed: this is a family's workspace, not a page about anyone. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function ManageMemorialPage(props: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await props.params;
  setRequestLocale(locale);

  const t = await getTranslations("memorial");
  const actor = await currentActor();
  const result = await loadMemorialDetail(slug, actor);

  if (!result.ok) {
    notFound();
  }

  const { detail } = result;

  /*
   * A viewer who may read the memorial but not edit it gets a 404 rather than
   * a refusal. They already know the page exists — the memorial itself told
   * them — but nothing here should confirm that a management surface is where
   * they guessed it might be.
   */
  const role = detail.viewerRole === "public_visitor" ? null : detail.viewerRole;
  const mayEditStory = canOnMemorial({ actor, role, action: "publish_content" });
  const mayConfigure = canOnMemorial({ actor, role, action: "configure_rituals" });
  const mayManageFamily = canOnMemorial({
    actor,
    role,
    action: "manage_family_links",
  });
  const mayModerate = canOnMemorial({
    actor,
    role,
    action: "moderate_submission",
  });

  if (!mayEditStory && !mayConfigure) {
    notFound();
  }

  const normalized = normalizeLocale(locale);

  const [
    published,
    draft,
    rituals,
    photos,
    existingRelatives,
    familyLinks,
    otherMemorials,
  ] = await Promise.all([
    publishedBiography(detail.memorialId),
    latestBiographyDraft(detail.memorialId),
    mayConfigure ? ritualChoices(detail.memorialId, normalized) : [],
    mayEditStory ? manageableMedia(detail.memorialId) : [],
    mayEditStory
      ? db()
          .select({
            id: memorialRelatives.id,
            name: memorialRelatives.name,
            relationshipToDeceased: memorialRelatives.relationshipToDeceased,
            isDeceased: memorialRelatives.isDeceased,
            showFullName: memorialRelatives.showFullName,
            nameVisibility: memorialRelatives.nameVisibility,
            coParentId: memorialRelatives.coParentId,
            spouseOfId: memorialRelatives.spouseOfId,
          })
          .from(memorialRelatives)
          .where(eq(memorialRelatives.memorialId, detail.memorialId))
          .orderBy(asc(memorialRelatives.displayOrder))
      : [],
    mayConfigure ? memorialFamilyLinks(detail.memorialId) : [],
    // The owner's other memorials, offered as things to link this one to.
    mayConfigure && actor.userId
      ? db()
          .select({ id: memorials.id, name: memorialNames.value })
          .from(memorialMembers)
          .innerJoin(memorials, eq(memorials.id, memorialMembers.memorialId))
          .leftJoin(
            memorialNames,
            and(
              eq(memorialNames.memorialId, memorials.id),
              eq(memorialNames.type, "primary"),
            ),
          )
          .where(
            and(
              eq(memorialMembers.userId, actor.userId),
              isNull(memorialMembers.revokedAt),
              isNull(memorials.deletionRequestedAt),
              ne(memorials.id, detail.memorialId),
            ),
          )
          .orderBy(desc(memorials.createdAt))
      : [],
  ]);

  // The draft is what they were last writing; the published version is what
  // visitors see. Editing continues from the draft when one is ahead.
  const editing = draft ?? published;

  // The family's donation ledger — only someone who may edit the memorial (an
  // owner or editor) sees who gave and how much.
  const donations = mayEditStory
    ? await listDonations(detail.memorialId)
    : null;

  // The structured life story, broken into chapters. Editing is the same
  // capability as editing the biography.
  const chapters = mayEditStory
    ? await listManageChapters(detail.memorialId)
    : null;

  // Friend-and-family remembrances awaiting review.
  const pendingContributions = mayModerate
    ? await listPendingContributions(detail.memorialId)
    : null;

  // People asking to be recognised as a relative of this person. Only someone
  // trusted with the family links sees or answers them.
  const roleLabel = (relationship: string): string => {
    const key = `relativeRole_${relationship}`;
    return t.has(key) ? t(key) : relationship;
  };
  const pendingClaims = mayManageFamily
    ? await listPendingClaims(actor, detail.memorialId)
    : null;
  const recognitionClaims =
    pendingClaims && pendingClaims.ok
      ? pendingClaims.value.claims.map((claim) => ({
          id: claim.id,
          claimedName: claim.claimedName,
          relationLabel: roleLabel(claim.claimedRelationship),
          kinshipVerified: claim.kinshipVerified,
        }))
      : [];

  const hasReview =
    (mayManageFamily && recognitionClaims.length > 0) ||
    Boolean(pendingContributions && pendingContributions.length > 0);

  return (
    <main id="main" className="container section">
      <div className="manageLayout stack-lg">
        <header>
          <h1 className="manageName">{detail.primaryName}</h1>
        </header>

        {hasReview ? (
          <section className="manageGroup">
            <p className="manageGroupLabel isAction">
              {t("manageGroupAction")}
            </p>
            {mayManageFamily && recognitionClaims.length > 0 ? (
              <div className="manageCard">
                <RecognitionReview
                  memorialId={detail.memorialId}
                  initial={recognitionClaims}
                />
              </div>
            ) : null}
            {pendingContributions && pendingContributions.length > 0 ? (
              <div className="manageCard">
                <ContributionsReview
                  memorialId={detail.memorialId}
                  locale={normalized}
                  initial={pendingContributions}
                />
              </div>
            ) : null}
          </section>
        ) : null}

        {mayEditStory || mayConfigure ? (
          <section className="manageGroup">
            <p className="manageGroupLabel">{t("manageGroupContent")}</p>
            <div className="manageCard">
              <ManageForms
                memorialId={detail.memorialId}
                locale={normalized}
                slug={detail.slug}
                mayEditStory={mayEditStory}
                mayConfigure={mayConfigure}
                initialTitle={editing?.title ?? ""}
                initialBody={editing?.body ?? ""}
                hasUnpublishedDraft={
                  draft !== null &&
                  draft.version !== (published?.version ?? -1)
                }
                rituals={rituals
                  .filter((choice) => choice.name !== null)
                  .map((choice) => ({
                    ritualVersionId: choice.ritualVersionId,
                    name: choice.name as string,
                    description: choice.description,
                    enabled: choice.enabled,
                    allowAnonymous: choice.allowAnonymous,
                    allowMessage: choice.allowMessage,
                    moderationMode: choice.moderationMode,
                  }))}
              />
            </div>
            {chapters ? (
              <div className="manageCard">
                <ChaptersEditor
                  memorialId={detail.memorialId}
                  locale={normalized}
                  initial={chapters}
                />
              </div>
            ) : null}
            {mayEditStory ? (
              <div className="manageCard">
                <PhotoManager
                  memorialId={detail.memorialId}
                  initial={photos}
                />
              </div>
            ) : null}
          </section>
        ) : null}

        {mayEditStory || mayConfigure ? (
          <section className="manageGroup">
            <p className="manageGroupLabel">{t("manageGroupFamily")}</p>
            {mayEditStory ? (
              <div className="manageCard">
                <RelativesEditor
                  memorialId={detail.memorialId}
                  initial={existingRelatives}
                />
              </div>
            ) : null}
            {mayConfigure ? (
              <div className="manageCard">
                <FamilyEditor
                  memorialId={detail.memorialId}
                  locale={locale}
                  initial={familyLinks}
                  others={otherMemorials.map((other) => ({
                    id: other.id,
                    name: other.name ?? "—",
                  }))}
                />
              </div>
            ) : null}
          </section>
        ) : null}

        {donations ? (
          <section className="manageGroup">
            <p className="manageGroupLabel">{t("manageGroupOfferings")}</p>
            <div className="manageCard">
              <DonationsPanel locale={normalized} ledger={donations} />
            </div>
          </section>
        ) : null}

        {mayConfigure ? (
          <section className="manageGroup">
            <p className="manageGroupLabel">{t("manageGroupSettings")}</p>
            <div className="manageCard">
              <PrivacyEditor
                memorialId={detail.memorialId}
                initialVisibility={detail.visibility}
                initialIndexable={detail.searchEngineIndexable}
              />
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

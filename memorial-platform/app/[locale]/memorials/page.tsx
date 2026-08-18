import { and, desc, eq, isNull, ne } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/db/client";
import {
  deceasedPeople,
  memorialBookmarks,
  memorialMembers,
  memorialNames,
  memorials,
} from "@/db/schema";
import { currentActor } from "@/modules/auth/current-user";
import { loadProfile } from "@/modules/identity/profile";
import { discoverMentions } from "@/modules/memorials/recognition-discovery";
import { DeleteMemorialButton } from "./delete-memorial-button";
import { RemoveBookmarkButton } from "./remove-bookmark-button";
import { RecognitionClaimButton } from "./recognition-claim-button";

export const dynamic = "force-dynamic";

/** A private workspace listing — never indexed. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type MemorialRow = {
  id: string;
  slug: string;
  status: string;
  name: string | null;
  birthDate: string | null;
  deathDate: string | null;
};

const cardColumns = {
  id: memorials.id,
  slug: memorials.slug,
  status: memorials.status,
  name: memorialNames.value,
  birthDate: deceasedPeople.birthDate,
  deathDate: deceasedPeople.deathDate,
};

function yearOf(date: string | null): string | null {
  if (!date) return null;
  const year = date.slice(0, 4);
  return /^\d{4}$/.test(year) ? year : null;
}

/** Memorials this person is a member of; owner vs. everyone else. */
async function membershipMemorials(
  userId: string,
  side: "owner" | "other",
): Promise<MemorialRow[]> {
  return db()
    .select(cardColumns)
    .from(memorialMembers)
    .innerJoin(memorials, eq(memorials.id, memorialMembers.memorialId))
    .innerJoin(deceasedPeople, eq(deceasedPeople.id, memorials.deceasedPersonId))
    .leftJoin(
      memorialNames,
      and(
        eq(memorialNames.memorialId, memorials.id),
        eq(memorialNames.type, "primary"),
      ),
    )
    .where(
      and(
        eq(memorialMembers.userId, userId),
        isNull(memorialMembers.revokedAt),
        isNull(memorials.deletionRequestedAt),
        side === "owner"
          ? eq(memorialMembers.role, "owner")
          : ne(memorialMembers.role, "owner"),
      ),
    )
    .orderBy(desc(memorials.createdAt));
}

/** Memorials this person has bookmarked. */
async function bookmarkedMemorials(userId: string): Promise<MemorialRow[]> {
  return db()
    .select(cardColumns)
    .from(memorialBookmarks)
    .innerJoin(memorials, eq(memorials.id, memorialBookmarks.memorialId))
    .innerJoin(deceasedPeople, eq(deceasedPeople.id, memorials.deceasedPersonId))
    .leftJoin(
      memorialNames,
      and(
        eq(memorialNames.memorialId, memorials.id),
        eq(memorialNames.type, "primary"),
      ),
    )
    .where(
      and(
        eq(memorialBookmarks.userId, userId),
        isNull(memorials.deletionRequestedAt),
      ),
    )
    .orderBy(desc(memorialBookmarks.createdAt));
}

export default async function MyMemorialsPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  const t = await getTranslations("memorial");
  const nav = await getTranslations("nav");
  const home = await getTranslations("home");
  const actor = await currentActor();

  if (!actor.userId) {
    return (
      <main id="main" className="container section measure stack">
        <h1>{nav("myMemorials")}</h1>
        <p className="lede">{t("signInToCreate")}</p>
        <div>
          <Link
            className="button buttonPrimary"
            href={`/${locale}/sign-in?next=${encodeURIComponent(`/${locale}/memorials`)}`}
          >
            {nav("signIn")}
          </Link>
        </div>
      </main>
    );
  }

  const profile = await loadProfile(actor.userId);
  const [created, related, bookmarked, mentions] = await Promise.all([
    membershipMemorials(actor.userId, "owner"),
    membershipMemorials(actor.userId, "other"),
    bookmarkedMemorials(actor.userId),
    discoverMentions(actor.userId, profile?.fullName ?? null),
  ]);

  const roleLabel = (relationship: string): string => {
    const key = `relativeRole_${relationship}`;
    return t.has(key) ? t(key) : relationship;
  };

  const card = (row: MemorialRow, variant: "created" | "related" | "bookmarked") => {
    const years = [yearOf(row.birthDate), yearOf(row.deathDate)]
      .filter(Boolean)
      .join(" – ");
    return (
      <li className="memorialCard" key={`${variant}-${row.id}`}>
        <div className="memorialCardBody">
          <span className="memorialCardName">{row.name ?? "—"}</span>
          <span className="memorialCardMeta">
            {years ? <span>{years}</span> : null}
            {variant === "created" ? (
              <span
                className={
                  row.status === "published"
                    ? "statusPill statusPillPublished"
                    : "statusPill"
                }
              >
                {row.status === "published"
                  ? t("statusPublished")
                  : t("statusDraft")}
              </span>
            ) : null}
          </span>
        </div>
        <div className="memorialCardActions">
          <Link
            className="button buttonQuiet buttonCompact"
            href={`/${locale}/memorials/${row.slug}`}
          >
            {t("enterMemorial")}
          </Link>
          {variant === "created" ? (
            <>
              <Link
                className="button buttonPrimary buttonCompact"
                href={`/${locale}/memorials/${row.slug}/manage`}
              >
                {t("manageLink")}
              </Link>
              <DeleteMemorialButton memorialId={row.id} />
            </>
          ) : null}
          {variant === "bookmarked" ? (
            <RemoveBookmarkButton memorialId={row.id} />
          ) : null}
        </div>
      </li>
    );
  };

  const section = (
    heading: string,
    empty: string,
    rows: MemorialRow[],
    variant: "created" | "related" | "bookmarked",
  ) => (
    <section className="stack">
      <h2>{heading}</h2>
      {rows.length === 0 ? (
        <p className="muted">{empty}</p>
      ) : (
        <ul className="memorialCardList">{rows.map((row) => card(row, variant))}</ul>
      )}
    </section>
  );

  return (
    <main id="main" className="container section stack-lg">
      <header className="stack measure">
        <h1>{nav("myMemorials")}</h1>
        <div>
          <Link
            className="button buttonPrimary buttonCompact"
            href={`/${locale}/memorials/new`}
          >
            {home("createMemorial")}
          </Link>
        </div>
      </header>

      {mentions.length > 0 ? (
        <section className="stack">
          <div className="stack">
            <h2>{t("myMentions")}</h2>
            <p className="muted">{t("myMentionsHint")}</p>
          </div>
          <ul className="memorialCardList">
            {mentions.map((mention) => {
              const years = [yearOf(mention.birthDate), yearOf(mention.deathDate)]
                .filter(Boolean)
                .join(" – ");
              return (
                <li className="memorialCard" key={`mention-${mention.memorialId}`}>
                  <div className="memorialCardBody">
                    <span className="memorialCardName">
                      {mention.deceasedName ?? "—"}
                    </span>
                    <span className="memorialCardMeta">
                      {years ? <span>{years}</span> : null}
                      <span>
                        {t("mentionListedAs", {
                          relation: roleLabel(mention.relationship),
                        })}
                      </span>
                    </span>
                  </div>
                  <div className="memorialCardActions">
                    <Link
                      className="button buttonQuiet buttonCompact"
                      href={`/${locale}/memorials/${mention.slug}`}
                    >
                      {t("enterMemorial")}
                    </Link>
                    <RecognitionClaimButton
                      memorialId={mention.memorialId}
                      claimedName={mention.relativeName}
                      claimedRelationship={mention.relationship}
                      initialStatus={mention.claimStatus}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {section(t("myCreated"), t("myCreatedEmpty"), created, "created")}
      {section(t("myBookmarked"), t("myBookmarkedEmpty"), bookmarked, "bookmarked")}
      {section(t("myRelated"), t("myRelatedEmpty"), related, "related")}
    </main>
  );
}

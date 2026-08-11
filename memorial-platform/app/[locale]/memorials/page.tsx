import { and, desc, eq, isNull } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/db/client";
import {
  deceasedPeople,
  memorialMembers,
  memorialNames,
  memorials,
} from "@/db/schema";
import { currentActor } from "@/modules/auth/current-user";

export const dynamic = "force-dynamic";

/** A private workspace listing — never indexed. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

function yearOf(date: string | null): string | null {
  if (!date) return null;
  const year = date.slice(0, 4);
  return /^\d{4}$/.test(year) ? year : null;
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

  // Every memorial this person is a member of, newest first, with the primary
  // name and life years for the card.
  const rows = await db()
    .select({
      slug: memorials.slug,
      status: memorials.status,
      name: memorialNames.value,
      birthDate: deceasedPeople.birthDate,
      deathDate: deceasedPeople.deathDate,
    })
    .from(memorialMembers)
    .innerJoin(memorials, eq(memorials.id, memorialMembers.memorialId))
    .innerJoin(
      deceasedPeople,
      eq(deceasedPeople.id, memorials.deceasedPersonId),
    )
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
      ),
    )
    .orderBy(desc(memorials.createdAt));

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

      {rows.length === 0 ? (
        <p className="muted">{t("myMemorialsEmpty")}</p>
      ) : (
        <ul className="memorialCardList">
          {rows.map((row) => {
            const birth = yearOf(row.birthDate);
            const death = yearOf(row.deathDate);
            const years = [birth, death].filter(Boolean).join(" – ");
            return (
              <li className="memorialCard" key={row.slug}>
                <div className="memorialCardBody">
                  <span className="memorialCardName">{row.name ?? "—"}</span>
                  <span className="memorialCardMeta">
                    {years ? <span>{years}</span> : null}
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
                  </span>
                </div>
                <div className="memorialCardActions">
                  <Link
                    className="button buttonQuiet buttonCompact"
                    href={`/${locale}/memorials/${row.slug}`}
                  >
                    {t("enterMemorial")}
                  </Link>
                  <Link
                    className="button buttonPrimary buttonCompact"
                    href={`/${locale}/memorials/${row.slug}/manage`}
                  >
                    {t("manageLink")}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

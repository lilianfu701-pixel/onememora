import { asc, eq } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/db/client";
import { memorialRelatives } from "@/db/schema";
import { currentActor } from "@/modules/auth/current-user";
import { loadMemorialDetail } from "@/modules/memorials/detail";
import { familyViewForMemorial } from "@/modules/genealogy/family-view";
import { FamilyTree } from "../family-tree";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * The full family chart on its own full-width page — every generation the
 * memorial records, grandparents included, with room the memorial column can't
 * give. Linked from the memorial's "family" section.
 */
export default async function FamilyTreePage(props: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await props.params;
  setRequestLocale(locale);

  const t = await getTranslations("memorial");
  const actor = await currentActor();
  const result = await loadMemorialDetail(slug, actor);
  if (!result.ok) notFound();
  const { detail } = result;

  const relatives = await db()
    .select({
      id: memorialRelatives.id,
      name: memorialRelatives.name,
      relationshipToDeceased: memorialRelatives.relationshipToDeceased,
      isDeceased: memorialRelatives.isDeceased,
      showFullName: memorialRelatives.showFullName,
      coParentId: memorialRelatives.coParentId,
      spouseOfId: memorialRelatives.spouseOfId,
    })
    .from(memorialRelatives)
    .where(eq(memorialRelatives.memorialId, detail.memorialId))
    .orderBy(asc(memorialRelatives.displayOrder));

  const year = (
    date: string | null,
    precision: (typeof detail)["birthDatePrecision"],
  ): number | null =>
    date && precision !== "unknown" ? Number.parseInt(date.slice(0, 4), 10) : null;

  const familyView = await familyViewForMemorial(
    detail.memorialId,
    {
      name: detail.primaryName,
      birthYear: year(detail.birthDate, detail.birthDatePrecision),
      deathYear: year(detail.deathDate, detail.deathDatePrecision),
    },
    relatives,
    { recurse: true },
  );

  return (
    <main id="main" className="section familyPage">
      <div className="container">
        <header className="stack measure">
          <p className="eyebrow">{detail.primaryName}</p>
          <h1>{t("fullTreeTitle")}</h1>
          <p>
            <Link
              className="button buttonQuiet buttonCompact"
              href={`/${locale}/memorials/${detail.slug}`}
            >
              ← {t("enterMemorial")}
            </Link>
          </p>
        </header>
      </div>

      {familyView ? (
        <FamilyTree
          tree={familyView.tree}
          locale={locale}
          heading=""
          kinship={familyView.kinship}
          statusLiving={t("statusLiving")}
          statusDeceased={t("statusDeceased")}
        />
      ) : (
        <div className="container">
          <p className="muted">{t("fullTreeEmpty")}</p>
        </div>
      )}
    </main>
  );
}

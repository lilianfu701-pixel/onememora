import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { normalizeLocale } from "@/lib/locale";
import { recentMemorialsForChannel } from "@/modules/memorials/showcase";

/**
 * The "recently remembered" section on a channel's homepage: memorials the
 * family opted to feature, published within the last month, belonging to the
 * viewer's channel. A Chinese figure marked cross-strait appears on all three
 * Chinese homepages; everyone else appears on their own language's homepage.
 *
 * Renders nothing when the channel has none, so an empty homepage stays clean.
 * Cached with the homepage (revalidate = 3600), so it costs one query per
 * channel per hour rather than one per visit.
 */
export async function HomeShowcase({
  locale,
}: {
  locale: string;
}): Promise<React.ReactElement | null> {
  const channel = normalizeLocale(locale);
  const memorials = await recentMemorialsForChannel(channel);

  if (memorials.length === 0) {
    return null;
  }

  const t = await getTranslations("home");

  const yearRange = (birthYear: number | null, deathYear: number | null) => {
    if (birthYear && deathYear) return `${birthYear} – ${deathYear}`;
    if (deathYear) return String(deathYear);
    if (birthYear) return String(birthYear);
    return "";
  };

  return (
    <section className="section">
      <div className="container stack-lg">
        <h2 className="textCenter">{t("latestTitle")}</h2>
        <div className="showcaseGrid">
          {memorials.map((m) => {
            const dates = yearRange(m.birthYear, m.deathYear);
            return (
              <Link
                key={m.slug}
                className="showcaseCard"
                href={`/${locale}/memorials/${m.slug}`}
              >
                <span className="showcaseName">{m.name}</span>
                {dates ? <span className="showcaseDates">{dates}</span> : null}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

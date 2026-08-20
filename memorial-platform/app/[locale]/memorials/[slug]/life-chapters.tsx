import { getTranslations } from "next-intl/server";
import type { PublicChapter } from "@/modules/memorials/life-chapters";

/**
 * The published life story, told in chapters.
 *
 * An editorial long-form: each stage of the life is its own titled section.
 * The title is the family's custom title when set, otherwise the translated
 * name of the chapter kind. Bodies are plain text; blank lines separate
 * paragraphs, single line breaks are kept within one.
 */
export async function LifeChapters(props: {
  locale: string;
  chapters: PublicChapter[];
}) {
  if (props.chapters.length === 0) return null;

  const t = await getTranslations({
    locale: props.locale,
    namespace: "lifeChapters",
  });

  const titleFor = (chapter: PublicChapter): string => {
    if (chapter.customTitle) return chapter.customTitle;
    const key = `titles.${chapter.chapterKey}`;
    return t.has(key) ? t(key) : t("titles.custom");
  };

  return (
    <section className="lifeChapters" aria-label={t("sectionTitle")}>
      <h2 className="lifeChaptersHeading">{t("sectionTitle")}</h2>
      <div className="lifeChaptersList">
        {props.chapters.map((chapter, index) => (
          <article key={chapter.id} className="lifeChapter">
            <p className="lifeChapterEyebrow">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h3 className="lifeChapterTitle">{titleFor(chapter)}</h3>
            <div className="lifeChapterBody">
              {chapter.body
                .split(/\n{2,}/)
                .map((para) => para.trim())
                .filter((para) => para.length > 0)
                .map((para, i) => (
                  <p key={i}>
                    {para.split("\n").map((line, j, lines) => (
                      <span key={j}>
                        {line}
                        {j < lines.length - 1 ? <br /> : null}
                      </span>
                    ))}
                  </p>
                ))}
              {chapter.photos.length > 0 ? (
                <div className="lifeChapterPhotos">
                  {chapter.photos
                    .filter((photo) => photo.url)
                    .map((photo) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={photo.mediaId}
                        className="lifeChapterPhoto"
                        src={photo.url as string}
                        alt={photo.caption ?? titleFor(chapter)}
                        loading="lazy"
                      />
                    ))}
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

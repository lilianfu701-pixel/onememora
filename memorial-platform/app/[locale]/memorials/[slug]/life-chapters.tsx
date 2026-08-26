"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { PublicChapter } from "@/modules/memorials/life-chapters";

/** Longer than this (characters) and a chapter is collapsed until opened. */
const COLLAPSE_OVER = 140;

/**
 * The published life story, told in chapters.
 *
 * A long chapter is shown as a short lead with "read more"; opening one shows it
 * in full and closes whichever was open, so the story stays a single readable
 * column rather than a tall wall of text. Short chapters are always shown whole.
 */
export function LifeChapters(props: {
  locale: string;
  chapters: PublicChapter[];
}) {
  const t = useTranslations("lifeChapters");
  const [openId, setOpenId] = useState<string | null>(null);

  if (props.chapters.length === 0) return null;

  const titleFor = (chapter: PublicChapter): string => {
    if (chapter.customTitle) return chapter.customTitle;
    const key = `titles.${chapter.chapterKey}`;
    return t.has(key) ? t(key) : t("titles.custom");
  };

  const paragraphs = (body: string): string[] =>
    body
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

  return (
    <section className="lifeChapters" aria-label={t("sectionTitle")}>
      <h2 className="lifeChaptersHeading">{t("sectionTitle")}</h2>
      <div className="lifeChaptersList">
        {props.chapters.map((chapter, index) => {
          const long = chapter.body.length > COLLAPSE_OVER;
          const open = !long || openId === chapter.id;

          return (
            <article key={chapter.id} className="lifeChapter">
              <p className="lifeChapterEyebrow">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="lifeChapterTitle">{titleFor(chapter)}</h3>

              <div className="lifeChapterBody">
                {open ? (
                  <>
                    {paragraphs(chapter.body).map((para, i) => (
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
                  </>
                ) : (
                  <p className="lifeChapterExcerpt">
                    {chapter.body.slice(0, COLLAPSE_OVER).trim()}…
                  </p>
                )}

                {long ? (
                  <button
                    type="button"
                    className="linkButton lifeChapterToggle"
                    onClick={() => setOpenId(open ? null : chapter.id)}
                  >
                    {open ? t("chapterLess") : t("chapterMore")}
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

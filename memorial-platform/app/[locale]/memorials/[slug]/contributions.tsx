"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { PublicContribution } from "@/modules/memorials/contributions";

type ChapterOption = {
  id: string;
  chapterKey: string;
  customTitle: string | null;
};

function paragraphs(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

export function Contributions(props: {
  memorialId: string;
  locale: string;
  initial: PublicContribution[];
  chapters: ChapterOption[];
}) {
  const t = useTranslations("contributions");
  const tc = useTranslations("lifeChapters");

  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const [body, setBody] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<"ok" | "fail" | "rate" | null>(null);

  const chapterTitle = (key: string, custom: string | null): string =>
    custom ?? (tc.has(`titles.${key}`) ? tc(`titles.${key}`) : tc("titles.custom"));

  const byline = (c: PublicContribution): string => {
    const who = c.name?.trim() || t("anonymous");
    return c.relation?.trim() ? `—— ${who}（${c.relation.trim()}）` : `—— ${who}`;
  };

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (body.trim().length === 0 || sending) return;
    setSending(true);
    setNotice(null);
    try {
      const res = await fetch(
        `/api/memorials/${props.memorialId}/contributions`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: name.trim() || undefined,
            relation: relation.trim() || undefined,
            body: body.trim(),
            sourceLocale: props.locale,
            chapterId: chapterId || undefined,
          }),
        },
      );
      if (res.status === 429) {
        setNotice("rate");
        return;
      }
      if (!res.ok) {
        setNotice("fail");
        return;
      }
      setName("");
      setRelation("");
      setBody("");
      setChapterId("");
      setNotice("ok");
    } catch {
      setNotice("fail");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="contributions" aria-label={t("sectionTitle")}>
      <h2 className="contributionsHeading">{t("sectionTitle")}</h2>

      {props.initial.length > 0 ? (
        <div className="contributionsList">
          {props.initial.map((c) => (
            <article key={c.id} className="contributionCard">
              {c.chapterKey ? (
                <span className="contributionTag">
                  {t("aboutChapter", {
                    title: chapterTitle(c.chapterKey, c.chapterCustomTitle),
                  })}
                </span>
              ) : null}
              <div className="contributionBody">
                {paragraphs(c.body).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
              {c.photos.length > 0 ? (
                <div className="contributionPhotos">
                  {c.photos
                    .filter((p) => p.url)
                    .map((p) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={p.mediaId}
                        className="contributionPhoto"
                        src={p.url as string}
                        alt={p.caption ?? ""}
                        loading="lazy"
                      />
                    ))}
                </div>
              ) : null}
              <p className="contributionByline">{byline(c)}</p>
            </article>
          ))}
        </div>
      ) : null}

      <form className="contributionForm card stack" onSubmit={submit}>
        <h3 className="contributionFormTitle">{t("formTitle")}</h3>
        <p className="muted contributionFormIntro">{t("formIntro")}</p>

        <label className="field">
          <span className="fieldLabel">{t("storyLabel")}</span>
          <textarea
            className="input"
            rows={4}
            maxLength={4000}
            placeholder={t("storyPlaceholder")}
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              setNotice(null);
            }}
          />
        </label>

        <div className="contributionFormRow">
          <label className="field">
            <span className="fieldLabel">{t("nameLabel")}</span>
            <input
              className="input"
              type="text"
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="field">
            <span className="fieldLabel">{t("relationLabel")}</span>
            <input
              className="input"
              type="text"
              maxLength={40}
              placeholder={t("relationPlaceholder")}
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
            />
          </label>
        </div>

        {props.chapters.length > 0 ? (
          <label className="field">
            <span className="fieldLabel">{t("chapterLabel")}</span>
            <select
              className="input"
              value={chapterId}
              onChange={(e) => setChapterId(e.target.value)}
            >
              <option value="">{t("chapterNone")}</option>
              {props.chapters.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {chapterTitle(ch.chapterKey, ch.customTitle)}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div>
          <button
            type="submit"
            className="button buttonPrimary"
            disabled={sending || body.trim().length === 0}
          >
            {sending ? t("submitting") : t("submit")}
          </button>
        </div>

        {notice === "ok" ? (
          <p className="notice" role="status">
            {t("thanks")}
          </p>
        ) : null}
        {notice === "rate" ? (
          <p className="fieldError" role="alert">
            {t("rateLimited")}
          </p>
        ) : null}
        {notice === "fail" ? (
          <p className="fieldError" role="alert">
            {t("failed")}
          </p>
        ) : null}
      </form>
    </section>
  );
}

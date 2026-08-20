"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ManageChapter } from "@/modules/memorials/life-chapters";
import {
  CUSTOM_CHAPTER_KEY,
  LIFE_CHAPTER_KEYS,
} from "@/modules/memorials/life-chapter-catalog";

type Edit = { body?: string; title?: string };

export function ChaptersEditor(props: {
  memorialId: string;
  locale: string;
  initial: ManageChapter[];
}) {
  const t = useTranslations("lifeChapters");
  const router = useRouter();

  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState<"saved" | "published" | "fail" | null>(
    null,
  );
  const [addKey, setAddKey] = useState("");

  const chapters = props.initial;
  const usedKeys = new Set(chapters.map((c) => c.chapterKey));
  const addableKeys = (LIFE_CHAPTER_KEYS as readonly string[]).filter(
    (k) => !usedKeys.has(k),
  );

  const titleOf = (c: ManageChapter): string =>
    c.customTitle ??
    (t.has(`titles.${c.chapterKey}`)
      ? t(`titles.${c.chapterKey}`)
      : t("titles.custom"));

  const bodyOf = (c: ManageChapter): string =>
    edits[c.id]?.body ?? c.draftBody;

  const customTitleOf = (c: ManageChapter): string =>
    edits[c.id]?.title ?? c.customTitle ?? "";

  async function call(
    url: string,
    method: string,
    payload?: Record<string, unknown>,
  ): Promise<boolean> {
    setNotice(null);
    try {
      const res = await fetch(url, {
        method,
        headers: payload ? { "content-type": "application/json" } : {},
        ...(payload ? { body: JSON.stringify(payload) } : {}),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async function save(c: ManageChapter): Promise<void> {
    const body = bodyOf(c).trim();
    if (body.length === 0 || pending) return;
    const isCustom = c.chapterKey === CUSTOM_CHAPTER_KEY;
    if (isCustom && customTitleOf(c).trim().length === 0) {
      setNotice("fail");
      return;
    }
    setPending(c.id);
    const ok = await call(
      `/api/memorials/${props.memorialId}/chapters/${c.id}`,
      "PUT",
      {
        body,
        sourceLocale: props.locale,
        ...(isCustom ? { customTitle: customTitleOf(c).trim() } : {}),
      },
    );
    setPending(null);
    if (ok) {
      setEdits((e) => {
        const next = { ...e };
        delete next[c.id];
        return next;
      });
      setNotice("saved");
      router.refresh();
    } else {
      setNotice("fail");
    }
  }

  async function publish(c: ManageChapter): Promise<void> {
    if (pending) return;
    setPending(c.id);
    const ok = await call(
      `/api/memorials/${props.memorialId}/chapters/${c.id}/publish`,
      "POST",
    );
    setPending(null);
    if (ok) {
      setNotice("published");
      router.refresh();
    } else {
      setNotice("fail");
    }
  }

  async function remove(c: ManageChapter): Promise<void> {
    if (pending) return;
    if (!window.confirm(t("confirmRemove"))) return;
    setPending(c.id);
    const ok = await call(
      `/api/memorials/${props.memorialId}/chapters/${c.id}`,
      "DELETE",
    );
    setPending(null);
    if (ok) router.refresh();
    else setNotice("fail");
  }

  async function move(index: number, dir: -1 | 1): Promise<void> {
    const target = index + dir;
    if (target < 0 || target >= chapters.length || pending) return;
    const ids = chapters.map((c) => c.id);
    const a = ids[index];
    const b = ids[target];
    if (!a || !b) return;
    ids[index] = b;
    ids[target] = a;
    setPending("reorder");
    const ok = await call(
      `/api/memorials/${props.memorialId}/chapters/reorder`,
      "POST",
      { orderedIds: ids },
    );
    setPending(null);
    if (ok) router.refresh();
    else setNotice("fail");
  }

  async function add(chapterKey: string): Promise<void> {
    if (pending || chapterKey.length === 0) return;
    setPending("add");
    const ok = await call(
      `/api/memorials/${props.memorialId}/chapters`,
      "POST",
      { chapterKey },
    );
    setPending(null);
    if (ok) {
      setAddKey("");
      router.refresh();
    } else {
      setNotice("fail");
    }
  }

  function badge(c: ManageChapter): { label: string; cls: string } {
    if (c.hasUnpublishedEdit)
      return { label: t("unpublishedEdit"), cls: "chapterBadgeEdit" };
    if (c.status === "published")
      return { label: t("published"), cls: "chapterBadgePublished" };
    return { label: t("draft"), cls: "chapterBadgeDraft" };
  }

  return (
    <section className="stack chaptersEditor">
      <h2>{t("sectionTitle")}</h2>

      {notice === "saved" ? (
        <p className="notice" role="status">
          {t("saved")}
        </p>
      ) : null}
      {notice === "published" ? (
        <p className="notice" role="status">
          {t("publishedToast")}
        </p>
      ) : null}
      {notice === "fail" ? (
        <p className="fieldError" role="alert">
          {t("failed")}
        </p>
      ) : null}

      <div className="chaptersList">
        {chapters.map((c, index) => {
          const b = badge(c);
          const isCustom = c.chapterKey === CUSTOM_CHAPTER_KEY;
          return (
            <div key={c.id} className="chapterCard card stack">
              <div className="chapterCardHead">
                <div className="chapterCardTitleWrap">
                  {isCustom ? (
                    <input
                      className="input chapterTitleInput"
                      type="text"
                      maxLength={80}
                      placeholder={t("chapterTitlePlaceholder")}
                      value={customTitleOf(c)}
                      onChange={(e) =>
                        setEdits((prev) => ({
                          ...prev,
                          [c.id]: { ...prev[c.id], title: e.target.value },
                        }))
                      }
                    />
                  ) : (
                    <h3 className="chapterCardTitle">{titleOf(c)}</h3>
                  )}
                  <span className={`chapterBadge ${b.cls}`}>{b.label}</span>
                </div>
                <div className="chapterCardControls">
                  <button
                    type="button"
                    className="iconButton"
                    aria-label={t("moveUp")}
                    disabled={index === 0 || pending !== null}
                    onClick={() => move(index, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="iconButton"
                    aria-label={t("moveDown")}
                    disabled={index === chapters.length - 1 || pending !== null}
                    onClick={() => move(index, 1)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="linkButton chapterRemove"
                    disabled={pending !== null}
                    onClick={() => remove(c)}
                  >
                    {t("remove")}
                  </button>
                </div>
              </div>

              <textarea
                className="input chapterBodyInput"
                rows={6}
                maxLength={20000}
                placeholder={
                  t.has(`prompts.${c.chapterKey}`)
                    ? t(`prompts.${c.chapterKey}`)
                    : t("prompts.custom")
                }
                value={bodyOf(c)}
                onChange={(e) =>
                  setEdits((prev) => ({
                    ...prev,
                    [c.id]: { ...prev[c.id], body: e.target.value },
                  }))
                }
              />

              <div className="chapterCardActions">
                <button
                  type="button"
                  className="button buttonQuiet buttonCompact"
                  disabled={pending !== null || bodyOf(c).trim().length === 0}
                  onClick={() => save(c)}
                >
                  {t("save")}
                </button>
                <button
                  type="button"
                  className="button buttonPrimary buttonCompact"
                  disabled={pending !== null || c.latestVersion === 0}
                  onClick={() => publish(c)}
                >
                  {t("publish")}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="chapterAddRow card">
        {addableKeys.length > 0 ? (
          <div className="chapterAddPick">
            <select
              className="input"
              value={addKey}
              onChange={(e) => setAddKey(e.target.value)}
            >
              <option value="">{t("pickChapter")}</option>
              {addableKeys.map((k) => (
                <option key={k} value={k}>
                  {t(`titles.${k}`)}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="button buttonQuiet buttonCompact"
              disabled={pending !== null || addKey.length === 0}
              onClick={() => add(addKey)}
            >
              {t("addChapter")}
            </button>
          </div>
        ) : (
          <p className="muted chapterAllAdded">{t("allAdded")}</p>
        )}
        <button
          type="button"
          className="button buttonQuiet buttonCompact"
          disabled={pending !== null}
          onClick={() => add(CUSTOM_CHAPTER_KEY)}
        >
          + {t("customChapter")}
        </button>
      </div>
    </section>
  );
}

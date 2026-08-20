"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { ManageChapter } from "@/modules/memorials/life-chapters";
import {
  CUSTOM_CHAPTER_KEY,
  LIFE_CHAPTER_KEYS,
} from "@/modules/memorials/life-chapter-catalog";

type Edit = { body?: string; title?: string };

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp";
const MAX_BYTES = 15 * 1024 * 1024;
const POLL_INTERVAL_MS = 900;
const MAX_POLLS = 8;

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
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pickerFor = useRef<string | null>(null);

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

  function openPicker(chapterId: string): void {
    if (pending || uploadingFor) return;
    pickerFor.current = chapterId;
    fileRef.current?.click();
  }

  async function pollReady(mediaId: string, remaining: number): Promise<void> {
    if (remaining <= 0) return;
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    try {
      const res = await fetch(`/api/media/${mediaId}`);
      if (!res.ok) return;
      const status = (await res.json())?.data?.status;
      if (status === "ready" || status === "rejected") {
        router.refresh();
        return;
      }
      await pollReady(mediaId, remaining - 1);
    } catch {
      /* stop polling; a later refresh will pick up the final state */
    }
  }

  async function uploadPhoto(chapterId: string, file: File): Promise<void> {
    if (file.size === 0 || file.size > MAX_BYTES) {
      setNotice("fail");
      return;
    }
    setUploadingFor(chapterId);
    setNotice(null);
    try {
      const signRes = await fetch("/api/media/sign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          memorialId: props.memorialId,
          fileName: file.name,
          contentType: file.type,
          size: file.size,
        }),
      });
      if (!signRes.ok) throw new Error("sign");
      const sign = (await signRes.json()).data;

      const put = await fetch(sign.url, {
        method: "PUT",
        headers: sign.headers,
        body: file,
      });
      if (!put.ok) throw new Error("put");

      const complete = await fetch(
        `/api/media/${sign.mediaAssetId}/complete`,
        { method: "POST" },
      );
      if (!complete.ok) throw new Error("complete");

      const attach = await fetch(
        `/api/memorials/${props.memorialId}/chapters/${chapterId}/media`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ mediaId: sign.mediaAssetId }),
        },
      );
      if (!attach.ok) throw new Error("attach");

      router.refresh();
      await pollReady(sign.mediaAssetId, MAX_POLLS);
    } catch {
      setNotice("fail");
    } finally {
      setUploadingFor(null);
    }
  }

  async function removePhoto(
    chapterId: string,
    mediaId: string,
  ): Promise<void> {
    if (pending || uploadingFor) return;
    const ok = await call(
      `/api/memorials/${props.memorialId}/chapters/${chapterId}/media/${mediaId}`,
      "DELETE",
    );
    if (ok) router.refresh();
    else setNotice("fail");
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

              <div className="chapterPhotos">
                <div className="chapterPhotosHead">
                  <span className="chapterPhotosLabel">{t("photosLabel")}</span>
                  <button
                    type="button"
                    className="button buttonQuiet buttonCompact"
                    disabled={pending !== null || uploadingFor !== null}
                    onClick={() => openPicker(c.id)}
                  >
                    {uploadingFor === c.id ? t("uploading") : `+ ${t("addPhoto")}`}
                  </button>
                </div>
                {c.photos.length > 0 ? (
                  <div className="chapterPhotoGrid">
                    {c.photos.map((photo) => (
                      <div className="chapterPhotoTile" key={photo.mediaId}>
                        {photo.status === "ready" && photo.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            className="chapterPhotoThumb"
                            src={photo.url}
                            alt={photo.caption ?? ""}
                            loading="lazy"
                          />
                        ) : (
                          <div className="chapterPhotoPlaceholder">
                            <span className="muted">
                              {photo.status === "rejected"
                                ? t("photoRejected")
                                : t("photoProcessing")}
                            </span>
                          </div>
                        )}
                        <button
                          type="button"
                          className="chapterPhotoRemove"
                          aria-label={t("removePhoto")}
                          disabled={pending !== null || uploadingFor !== null}
                          onClick={() => removePhoto(c.id, photo.mediaId)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

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

      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED_TYPES}
        className="visuallyHidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          const chapterId = pickerFor.current;
          if (file && chapterId) uploadPhoto(chapterId, file);
          pickerFor.current = null;
          event.target.value = "";
        }}
      />
    </section>
  );
}

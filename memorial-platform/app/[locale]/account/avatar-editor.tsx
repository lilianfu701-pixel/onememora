"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { AvatarView } from "@/modules/identity/avatar";

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp";
const MAX_BYTES = 10 * 1024 * 1024;
const POLL_INTERVAL_MS = 900;
const MAX_POLLS = 8;

/**
 * The account holder's own photograph, and whether it may stand in for them on
 * a family chart. One picture, replaced rather than collected.
 */
export function AvatarEditor(props: { initial: AvatarView }) {
  const t = useTranslations("profile");
  const common = useTranslations("common");
  const errors = useTranslations("errors");
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [avatar, setAvatar] = useState<AvatarView>(props.initial);
  const [showInTree, setShowInTree] = useState(props.initial.showInTree);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  async function save(
    mediaId: string | null,
    inTree: boolean,
  ): Promise<boolean> {
    const res = await fetch("/api/profile/avatar", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mediaId, showInTree: inTree }),
    });
    return res.ok;
  }

  async function poll(mediaId: string, remaining: number): Promise<void> {
    if (remaining <= 0) return;
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const res = await fetch(`/api/media/${mediaId}`);
    // The status route is memorial-scoped; an avatar is not visible there, so
    // a refresh is what surfaces the finished picture.
    if (!res.ok) {
      router.refresh();
      return;
    }
    const data = (await res.json())?.data;
    if (data?.status === "ready" || data?.status === "rejected") {
      router.refresh();
      return;
    }
    await poll(mediaId, remaining - 1);
  }

  async function upload(file: File): Promise<void> {
    if (file.size === 0 || file.size > MAX_BYTES) {
      setFailure(errors("unexpected"));
      return;
    }
    setBusy(true);
    setFailure(null);
    try {
      const signRes = await fetch("/api/profile/avatar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
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

      const done = await fetch(`/api/media/${sign.mediaAssetId}/complete`, {
        method: "POST",
      });
      if (!done.ok) throw new Error("complete");

      if (!(await save(sign.mediaAssetId, showInTree))) throw new Error("save");

      setAvatar({
        mediaId: sign.mediaAssetId,
        url: null,
        status: "scanning",
        showInTree,
      });
      await poll(sign.mediaAssetId, MAX_POLLS);
    } catch {
      setFailure(errors("unexpected"));
    } finally {
      setBusy(false);
    }
  }

  async function remove(): Promise<void> {
    setBusy(true);
    try {
      if (avatar.mediaId) {
        await fetch(`/api/media/${avatar.mediaId}`, { method: "DELETE" });
      }
      await save(null, showInTree);
      setAvatar({ mediaId: null, url: null, status: null, showInTree });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function toggleTree(next: boolean): Promise<void> {
    setShowInTree(next);
    await save(avatar.mediaId, next);
    router.refresh();
  }

  return (
    <section className="accountSection">
      <h2 className="accountSectionTitle">{t("avatarTitle")}</h2>

      {failure ? (
        <p className="fieldError" role="alert">
          {failure}
        </p>
      ) : null}

      <div className="portraitRow">
        <div className="famAvatar avatarLarge">
          {avatar.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="avatarLargeImage" src={avatar.url} alt="" />
          ) : avatar.mediaId ? (
            <span className="muted">…</span>
          ) : (
            <span className="muted">◲</span>
          )}
        </div>

        <div className="portraitActions stack">
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED_TYPES}
            className="visuallyHidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) upload(file);
              event.target.value = "";
            }}
          />
          <div className="avatarButtons">
            <button
              type="button"
              className="button buttonPrimary buttonCompact"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              {busy
                ? common("loading")
                : avatar.mediaId
                  ? t("avatarReplace")
                  : t("avatarAdd")}
            </button>
            {avatar.mediaId ? (
              <button
                type="button"
                className="button buttonQuiet buttonCompact"
                disabled={busy}
                onClick={remove}
              >
                {common("remove")}
              </button>
            ) : null}
          </div>

          <label className="avatarTreeToggle">
            <input
              type="checkbox"
              checked={showInTree}
              disabled={busy}
              onChange={(e) => toggleTree(e.target.checked)}
            />
            <span>{t("avatarShowInTree")}</span>
          </label>
          <p className="muted photoFormatHint">{t("avatarHelp")}</p>
        </div>
      </div>
    </section>
  );
}

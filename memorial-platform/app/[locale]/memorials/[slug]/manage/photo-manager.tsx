"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type Photo = {
  id: string;
  altText: string | null;
  status: string;
  url: string | null;
};

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp";
const MAX_BYTES = 10 * 1024 * 1024;
const POLL_INTERVAL_MS = 900;
const MAX_POLLS = 8;

type UploadState =
  | { phase: "idle" }
  | { phase: "signing" }
  | { phase: "uploading" }
  | { phase: "completing" }
  | { phase: "processing"; id: string; polls: number }
  | { phase: "error"; code: string; reason?: string };

/**
 * The one portrait a memorial leads with — the 遗照. There is a single image,
 * not a gallery; choosing a new one replaces the old. Richer, multi-photo
 * galleries live inside the life chapters.
 */
export function PhotoManager(props: { memorialId: string; initial: Photo[] }) {
  const t = useTranslations("memorial");
  const errors = useTranslations("errors");
  const common = useTranslations("common");
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  // The portrait is the most recent photo; earlier ones are cleared on replace.
  const [portrait, setPortrait] = useState<Photo | null>(
    props.initial.length > 0 ? props.initial[props.initial.length - 1]! : null,
  );
  const supersededRef = useRef<string[]>([]);
  const [upload, setUpload] = useState<UploadState>({ phase: "idle" });

  function readError(payload: unknown): string {
    return (
      (payload as { error?: { code?: string } })?.error?.code ?? "unexpected"
    );
  }

  async function deleteAsset(id: string): Promise<void> {
    try {
      await fetch(`/api/media/${id}`, { method: "DELETE" });
    } catch {
      /* best effort — an orphaned asset is not shown */
    }
  }

  async function pollStatus(id: string, remaining: number): Promise<void> {
    if (remaining <= 0) {
      setUpload({ phase: "idle" });
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    try {
      const response = await fetch(`/api/media/${id}`);
      if (!response.ok) {
        setUpload({ phase: "error", code: "uploadFailed" });
        return;
      }
      const body = await response.json();
      const status = body.data?.status;

      if (status === "ready") {
        setPortrait({ id, altText: null, status: "ready", url: body.data.url });
        setUpload({ phase: "idle" });
        // Now that the new portrait is live, drop the ones it replaced.
        const old = supersededRef.current;
        supersededRef.current = [];
        for (const oldId of old) await deleteAsset(oldId);
        router.refresh();
        return;
      }
      if (status === "rejected") {
        setPortrait(null);
        setUpload({
          phase: "error",
          code: "imageRejected",
          reason: body.data?.rejectionReason ?? undefined,
        });
        return;
      }
      setUpload({ phase: "processing", id, polls: MAX_POLLS - remaining + 1 });
      await pollStatus(id, remaining - 1);
    } catch {
      setUpload({ phase: "error", code: "uploadFailed" });
    }
  }

  async function handleFile(file: File): Promise<void> {
    if (file.size > MAX_BYTES) {
      setUpload({ phase: "error", code: "imageTooLarge" });
      return;
    }
    if (file.size === 0) {
      setUpload({ phase: "error", code: "imageEmpty" });
      return;
    }

    setUpload({ phase: "signing" });
    try {
      const signResponse = await fetch("/api/media/sign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          memorialId: props.memorialId,
          fileName: file.name,
          contentType: file.type,
          size: file.size,
        }),
      });
      if (!signResponse.ok) {
        setUpload({
          phase: "error",
          code: readError(await signResponse.json().catch(() => null)),
        });
        return;
      }
      const signData = (await signResponse.json()).data;

      setUpload({ phase: "uploading" });
      const putResponse = await fetch(signData.url, {
        method: "PUT",
        headers: signData.headers,
        body: file,
      });
      if (!putResponse.ok) {
        setUpload({ phase: "error", code: "uploadFailed" });
        return;
      }

      setUpload({ phase: "completing" });
      const completeResponse = await fetch(
        `/api/media/${signData.mediaAssetId}/complete`,
        { method: "POST" },
      );
      if (!completeResponse.ok) {
        setUpload({
          phase: "error",
          code: readError(await completeResponse.json().catch(() => null)),
        });
        return;
      }

      // Remember the current portrait so it can be removed once the new one is
      // ready — never before, so a rejected upload leaves the old one intact.
      supersededRef.current = portrait ? [portrait.id] : [];
      setPortrait({
        id: signData.mediaAssetId,
        altText: null,
        status: "scanning",
        url: null,
      });
      setUpload({ phase: "processing", id: signData.mediaAssetId, polls: 0 });
      await pollStatus(signData.mediaAssetId, MAX_POLLS);
    } catch {
      setUpload({ phase: "error", code: "uploadFailed" });
    }
  }

  const busy = upload.phase !== "idle" && upload.phase !== "error";
  const ready = portrait?.status === "ready" && portrait.url;

  return (
    <section className="stack measure portraitManager">
      {upload.phase === "error" ? (
        <p className="fieldError" role="alert">
          {errors.has(upload.code)
            ? errors(upload.code)
            : t.has(upload.code)
              ? t(upload.code)
              : errors("unexpected")}
          {upload.reason ? ` (${upload.reason})` : ""}
        </p>
      ) : null}

      <div className="portraitRow">
        <div className="portraitFrame">
          {ready ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="portraitImage"
              src={portrait!.url as string}
              alt={portrait!.altText ?? t("photoAltFallback")}
            />
          ) : portrait ? (
            <span className="muted">{t("photoProcessing")}</span>
          ) : (
            <span className="muted portraitEmpty">
              <i aria-hidden="true">◲</i>
            </span>
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
              if (file) handleFile(file);
              event.target.value = "";
            }}
          />
          <div>
            <button
              type="button"
              className="button buttonPrimary buttonCompact"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              {busy
                ? common("loading")
                : portrait
                  ? t("replacePortrait")
                  : t("addPortrait")}
            </button>
          </div>
          <p className="muted photoFormatHint">{t("photosHelp")}</p>
        </div>
      </div>
    </section>
  );
}

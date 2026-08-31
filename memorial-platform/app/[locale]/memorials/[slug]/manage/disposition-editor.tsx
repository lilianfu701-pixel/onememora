"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Disposition } from "@/modules/memorials/disposition";
import { DispositionMapPicker } from "./disposition-map";

/** Kept in sync with DISPOSITION_METHODS on the server; inlined so this client
 *  component never imports the server module's runtime (db). */
const DISPOSITION_METHODS = [
  "ground",
  "cremation",
  "tree",
  "sea",
  "columbarium",
  "donation",
  "other",
] as const;

/**
 * Editor for the memorial's final-disposition record (身后安置). Owner/editor
 * picks a method and, when set, fills the place / date / a short line.
 */
export function DispositionEditor(props: {
  memorialId: string;
  initial: Disposition;
}) {
  const t = useTranslations("memorial");
  const common = useTranslations("common");
  const router = useRouter();

  const [method, setMethod] = useState<string>(props.initial.method ?? "");
  const [place, setPlace] = useState(props.initial.place ?? "");
  const [date, setDate] = useState(props.initial.date ?? "");
  const [note, setNote] = useState(props.initial.note ?? "");
  const [lng, setLng] = useState(props.initial.lng ?? "");
  const [lat, setLat] = useState(props.initial.lat ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  const [mediaId, setMediaId] = useState<string | null>(
    props.initial.mediaId ?? null,
  );
  const [photoUrl, setPhotoUrl] = useState<string | null>(
    props.initial.photoUrl ?? null,
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(false);

  async function pollReady(id: string, remaining: number): Promise<void> {
    if (remaining <= 0) {
      setUploadError(true);
      setUploading(false);
      return;
    }
    await new Promise((r) => setTimeout(r, 1500));
    const res = await fetch(`/api/media/${id}`);
    if (!res.ok) {
      setUploadError(true);
      setUploading(false);
      return;
    }
    const data = (await res.json()).data;
    if (data.status === "ready" && data.url) {
      setMediaId(id);
      setPhotoUrl(data.url);
      setUploading(false);
      return;
    }
    if (data.status === "rejected") {
      setUploadError(true);
      setUploading(false);
      return;
    }
    await pollReady(id, remaining - 1);
  }

  async function uploadPhoto(file: File): Promise<void> {
    setUploadError(false);
    setUploading(true);
    try {
      const sign = await fetch("/api/media/sign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          memorialId: props.memorialId,
          fileName: file.name,
          contentType: file.type,
          size: file.size,
        }),
      });
      if (!sign.ok) throw new Error("sign");
      const s = (await sign.json()).data;
      const put = await fetch(s.url, {
        method: "PUT",
        headers: s.headers,
        body: file,
      });
      if (!put.ok) throw new Error("put");
      const complete = await fetch(`/api/media/${s.mediaAssetId}/complete`, {
        method: "POST",
      });
      if (!complete.ok) throw new Error("complete");
      await pollReady(s.mediaAssetId, 20);
    } catch {
      setUploadError(true);
      setUploading(false);
    }
  }

  async function save(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setState("saving");
    try {
      const res = await fetch(
        `/api/memorials/${props.memorialId}/disposition`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            method: method || null,
            place: place.trim() || undefined,
            date: date.trim() || undefined,
            note: note.trim() || undefined,
            lng: lng || undefined,
            lat: lat || undefined,
            mediaId: mediaId,
          }),
        },
      );
      if (res.ok) {
        setState("saved");
        router.refresh();
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  return (
    <form className="stack" onSubmit={save}>
      <h2>{t("dispositionHeading")}</h2>
      <p className="muted" style={{ margin: 0 }}>
        {t("dispositionHint")}
      </p>

      <label className="field">
        <span className="fieldLabel">{t("dispositionMethodLabel")}</span>
        <select
          className="input"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
        >
          <option value="">{t("dispositionNone")}</option>
          {DISPOSITION_METHODS.map((m) => (
            <option key={m} value={m}>
              {t(`disp_${m}`)}
            </option>
          ))}
        </select>
      </label>

      {method ? (
        <>
          <label className="field">
            <span className="fieldLabel">{t("dispositionPlaceLabel")}</span>
            <input
              className="input"
              value={place}
              maxLength={200}
              placeholder={t("dispositionPlacePlaceholder")}
              onChange={(e) => setPlace(e.target.value)}
            />
          </label>

          <DispositionMapPicker
            lng={lng}
            lat={lat}
            onPick={(a, b, addr) => {
              setLng(a);
              setLat(b);
              if (!place.trim() && addr) setPlace(addr);
            }}
            searchPlaceholder={t("dispositionMapSearchPlaceholder")}
            searchLabel={t("dispositionMapSearch")}
            hint={t("dispositionMapHint")}
            unavailable={t("dispositionMapUnavailable")}
          />
          {lng && lat ? (
            <p className="muted" style={{ margin: 0 }}>
              {t("dispositionCoords", { lng, lat })}
            </p>
          ) : null}
          <label className="field">
            <span className="fieldLabel">{t("dispositionDateLabel")}</span>
            <input
              className="input"
              value={date}
              maxLength={40}
              placeholder={t("dispositionDatePlaceholder")}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label className="field">
            <span className="fieldLabel">{t("dispositionNoteLabel")}</span>
            <input
              className="input"
              value={note}
              maxLength={200}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>

          <div className="field">
            <span className="fieldLabel">{t("dispositionPhotoLabel")}</span>
            {photoUrl ? (
              <div className="dispositionPhotoEdit">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrl} alt="" />
                <button
                  type="button"
                  className="linkButton"
                  onClick={() => {
                    setMediaId(null);
                    setPhotoUrl(null);
                  }}
                >
                  {t("dispositionPhotoRemove")}
                </button>
              </div>
            ) : null}
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadPhoto(f);
                e.target.value = "";
              }}
            />
            {uploading ? (
              <span className="muted">{common("loading")}</span>
            ) : null}
            {uploadError ? (
              <span className="fieldError">{t("dispositionFailed")}</span>
            ) : null}
          </div>
        </>
      ) : null}

      <div className="adminHeadRow">
        <button
          type="submit"
          className="button buttonPrimary buttonCompact"
          disabled={state === "saving"}
        >
          {state === "saving" ? common("loading") : common("save")}
        </button>
        {state === "saved" ? (
          <span className="muted">{t("dispositionSaved")}</span>
        ) : null}
        {state === "error" ? (
          <span className="fieldError">{t("dispositionFailed")}</span>
        ) : null}
      </div>
    </form>
  );
}

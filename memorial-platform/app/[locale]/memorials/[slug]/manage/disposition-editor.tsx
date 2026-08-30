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

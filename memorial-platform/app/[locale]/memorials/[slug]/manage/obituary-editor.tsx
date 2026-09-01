"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Obituary } from "@/modules/memorials/obituary";

/** Editor for the memorial's obituary (讣告): a short notice the family shares. */
export function ObituaryEditor(props: {
  memorialId: string;
  slug: string;
  locale: string;
  initial: Obituary;
}) {
  const t = useTranslations("memorial");
  const common = useTranslations("common");
  const router = useRouter();

  const [body, setBody] = useState(props.initial.body ?? "");
  const [nativePlace, setNativePlace] = useState(props.initial.nativePlace ?? "");
  const [service, setService] = useState(props.initial.service ?? "");
  const [survivors, setSurvivors] = useState(props.initial.survivors ?? "");
  const [published, setPublished] = useState(props.initial.published);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  async function submit(publish: boolean): Promise<void> {
    setState("saving");
    try {
      const res = await fetch(
        `/api/memorials/${props.memorialId}/obituary`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            body: body.trim() || undefined,
            nativePlace: nativePlace.trim() || undefined,
            service: service.trim() || undefined,
            survivors: survivors.trim() || undefined,
            publish,
          }),
        },
      );
      if (res.ok) {
        const data = (await res.json()).data;
        setPublished(Boolean(data?.published));
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
    <div className="stack">
      <h2>{t("obituaryHeading")}</h2>
      <p className="muted" style={{ margin: 0 }}>
        {t("obituaryHint")}
      </p>

      <label className="field">
        <span className="fieldLabel">{t("obituaryBodyLabel")}</span>
        <textarea
          className="input"
          rows={6}
          maxLength={4000}
          value={body}
          placeholder={t("obituaryBodyPlaceholder")}
          onChange={(e) => setBody(e.target.value)}
        />
      </label>

      <label className="field">
        <span className="fieldLabel">{t("obituaryNativePlaceLabel")}</span>
        <input
          className="input"
          maxLength={120}
          value={nativePlace}
          onChange={(e) => setNativePlace(e.target.value)}
        />
      </label>

      <label className="field">
        <span className="fieldLabel">{t("obituaryServiceLabel")}</span>
        <textarea
          className="input"
          rows={3}
          maxLength={600}
          value={service}
          placeholder={t("obituaryServicePlaceholder")}
          onChange={(e) => setService(e.target.value)}
        />
      </label>

      <label className="field">
        <span className="fieldLabel">{t("obituarySurvivorsLabel")}</span>
        <input
          className="input"
          maxLength={400}
          value={survivors}
          placeholder={t("obituarySurvivorsPlaceholder")}
          onChange={(e) => setSurvivors(e.target.value)}
        />
      </label>

      <div className="adminHeadRow">
        <button
          type="button"
          className="button buttonQuiet buttonCompact"
          disabled={state === "saving"}
          onClick={() => submit(false)}
        >
          {common("save")}
        </button>
        <button
          type="button"
          className="button buttonPrimary buttonCompact"
          disabled={state === "saving" || body.trim().length === 0}
          onClick={() => submit(true)}
        >
          {published ? t("obituaryRepublish") : t("obituaryPublish")}
        </button>
        {published ? (
          <a
            className="linkButton"
            href={`/${props.locale}/memorials/${props.slug}/obituary`}
            target="_blank"
            rel="noreferrer"
          >
            {t("obituaryView")}
          </a>
        ) : null}
        {state === "saved" ? (
          <span className="muted">{t("dispositionSaved")}</span>
        ) : null}
        {state === "error" ? (
          <span className="fieldError">{t("dispositionFailed")}</span>
        ) : null}
      </div>
      <p className="muted" style={{ margin: 0, fontSize: "var(--text-sm)" }}>
        {published ? t("obituaryStatusPublished") : t("obituaryStatusDraft")}
      </p>
    </div>
  );
}

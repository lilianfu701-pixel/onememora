"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Edit the deceased's birth and death dates on the manage page — prefilled with
 * whatever was entered at creation (via the obituary or the create form).
 */
export function DetailsEditor(props: {
  memorialId: string;
  initialBirth: string;
  initialDeath: string;
}) {
  const t = useTranslations("memorial");
  const common = useTranslations("common");
  const router = useRouter();

  const [birth, setBirth] = useState(props.initialBirth);
  const [death, setDeath] = useState(props.initialDeath);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  // The single save button greys out while the fields match what was saved.
  const [saved, setSaved] = useState({
    birth: props.initialBirth,
    death: props.initialDeath,
  });
  const dirty = birth !== saved.birth || death !== saved.death;

  async function save(): Promise<void> {
    if (state === "saving" || !dirty) return;
    setState("saving");
    try {
      const res = await fetch(`/api/memorials/${props.memorialId}/details`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ birthDate: birth || "", deathDate: death || "" }),
      });
      if (res.ok) {
        setSaved({ birth, death });
        setState("saved");
        router.refresh();
        setTimeout(() => setState("idle"), 2000);
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  return (
    <div className="stack">
      <span className="fieldLabel">{t("basicInfoTitle")}</span>
      <div className="pairRow">
        <label className="field">
          <span className="fieldLabel">{t("birthDateLabel")}</span>
          <input
            className="input"
            type="date"
            value={birth}
            onChange={(e) => setBirth(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="fieldLabel">{t("deathDateLabel")}</span>
          <input
            className="input"
            type="date"
            value={death}
            onChange={(e) => setDeath(e.target.value)}
          />
        </label>
      </div>
      <div>
        <button
          type="button"
          className="button buttonPrimary buttonCompact"
          onClick={save}
          disabled={state === "saving" || !dirty}
        >
          {state === "saving"
            ? common("loading")
            : state === "saved"
              ? t("basicInfoSaved")
              : common("save")}
        </button>
      </div>
      {state === "error" ? (
        <p className="fieldError" role="alert">
          {t("obituaryPublishFailed")}
        </p>
      ) : null}
    </div>
  );
}

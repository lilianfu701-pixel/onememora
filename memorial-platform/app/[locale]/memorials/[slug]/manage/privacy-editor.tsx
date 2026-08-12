"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Visibility = "public" | "unlisted" | "invite_only";

type Notice =
  | { kind: "none" }
  | { kind: "saved" }
  | { kind: "error"; code: string };

export function PrivacyEditor(props: {
  memorialId: string;
  initialVisibility: Visibility;
  initialIndexable: boolean;
}) {
  const t = useTranslations("memorial");
  const privacy = useTranslations("privacy");
  const common = useTranslations("common");
  const errors = useTranslations("errors");
  const router = useRouter();

  const [visibility, setVisibility] = useState<Visibility>(
    props.initialVisibility,
  );
  const [indexable, setIndexable] = useState(props.initialIndexable);
  const [acknowledged, setAcknowledged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>({ kind: "none" });

  // Going public from a non-public state needs an explicit acknowledgement.
  const needsAcknowledgement =
    visibility === "public" && props.initialVisibility !== "public";

  const options: [Visibility, string, string][] = [
    ["public", privacy("public"), privacy("publicHelp")],
    ["unlisted", privacy("unlisted"), privacy("unlistedHelp")],
    ["invite_only", privacy("inviteOnly"), privacy("inviteOnlyHelp")],
  ];

  async function save(): Promise<void> {
    setSaving(true);
    setNotice({ kind: "none" });
    try {
      const response = await fetch(
        `/api/memorials/${props.memorialId}/privacy`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            visibility,
            searchEngineIndexable: visibility === "public" ? indexable : false,
            ...(needsAcknowledgement
              ? { confirmPublicExposure: acknowledged }
              : {}),
          }),
        },
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: { code?: string };
        } | null;
        setNotice({
          kind: "error",
          code: payload?.error?.code ?? "unexpected",
        });
        return;
      }

      setNotice({ kind: "saved" });
      setAcknowledged(false);
      router.refresh();
    } catch {
      setNotice({ kind: "error", code: "DEPENDENCY_UNAVAILABLE" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="stack measure">
      <h2>{privacy("title")}</h2>

      {notice.kind === "saved" ? (
        <p className="notice">{t("privacySaved")}</p>
      ) : null}
      {notice.kind === "error" ? (
        <p className="fieldError" role="alert">
          {errors.has(notice.code) ? errors(notice.code) : errors("unexpected")}
        </p>
      ) : null}

      {options.map(([value, label, help]) => (
        <label className="choiceRow" key={value}>
          <input
            type="radio"
            name="visibility"
            checked={visibility === value}
            onChange={() => setVisibility(value)}
          />
          <span>
            <strong>{label}</strong>
            <span className="muted"> — {help}</span>
          </span>
        </label>
      ))}

      {visibility === "public" ? (
        <>
          <label className="choiceRow">
            <input
              type="checkbox"
              checked={indexable}
              onChange={(e) => setIndexable(e.target.checked)}
            />
            <span>{privacy("searchEngineLabel")}</span>
          </label>

          {needsAcknowledgement ? (
            <div className="notice stack">
              <strong>{privacy("confirmPublicTitle")}</strong>
              <p>{privacy("confirmPublicBody")}</p>
              <label className="choiceRow">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                />
                <span>{privacy("confirmPublicAcknowledge")}</span>
              </label>
            </div>
          ) : null}
        </>
      ) : null}

      <div>
        <button
          type="button"
          className="button buttonPrimary"
          disabled={saving || (needsAcknowledgement && !acknowledged)}
          onClick={save}
        >
          {saving ? common("loading") : common("save")}
        </button>
      </div>
    </section>
  );
}

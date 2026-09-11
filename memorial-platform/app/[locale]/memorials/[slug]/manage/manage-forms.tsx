"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type ManageableRitual = {
  ritualVersionId: string;
  name: string;
  description: string | null;
  enabled: boolean;
  allowAnonymous: boolean;
  allowMessage: boolean;
  moderationMode: "pre_review" | "post_review";
};

type Notice =
  | { kind: "none" }
  | { kind: "saved" }
  | { kind: "error"; code: string };

export function ManageForms(props: {
  memorialId: string;
  locale: string;
  slug: string;
  mayEditStory: boolean;
  mayConfigure: boolean;
  initialTitle: string;
  initialBody: string;
  hasUnpublishedDraft: boolean;
  rituals: ManageableRitual[];
}) {
  const t = useTranslations("memorial");
  const errors = useTranslations("errors");
  const common = useTranslations("common");
  const router = useRouter();

  const [title, setTitle] = useState(props.initialTitle);
  const [body, setBody] = useState(props.initialBody);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>({ kind: "none" });
  // The last values written to the server. The save button greys out while the
  // fields still match it, and lights up again the moment they diverge — one
  // button, and it only invites a save when there is something to save.
  const [savedTitle, setSavedTitle] = useState(props.initialTitle);
  const [savedBody, setSavedBody] = useState(props.initialBody);

  const dirty = title !== savedTitle || body !== savedBody;

  function readError(payload: unknown): string {
    const error = (payload as { error?: { code?: string } })?.error;
    return error?.code ?? "unexpected";
  }

  async function saveDraft(): Promise<void> {
    if (saving || !dirty || body.trim().length === 0) return;
    setSaving(true);
    setNotice({ kind: "none" });

    try {
      const response = await fetch(
        `/api/memorials/${props.memorialId}/biography`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            ...(title.trim() ? { title: title.trim() } : {}),
            body,
            sourceLocale: props.locale,
          }),
        },
      );

      if (!response.ok) {
        setNotice({
          kind: "error",
          code: readError(await response.json().catch(() => null)),
        });
        return;
      }

      setSavedTitle(title);
      setSavedBody(body);
      setNotice({ kind: "saved" });
      // Refresh so the shared "save and publish" button below learns a fresh
      // draft is now waiting to go live.
      router.refresh();
    } catch {
      setNotice({ kind: "error", code: "DEPENDENCY_UNAVAILABLE" });
    } finally {
      setSaving(false);
    }
  }


  return (
    <div className="stack-lg">
      {notice.kind === "saved" ? (
        <p className="notice">{t("lifeStorySaved")}</p>
      ) : null}
      {notice.kind === "error" ? (
        <p className="fieldError" role="alert">
          {errors.has(notice.code) ? errors(notice.code) : errors("unexpected")}
        </p>
      ) : null}

      {props.mayEditStory ? (
        <section className="stack measure">
          <h2>{t("lifeStory")}</h2>

          <label className="field">
            <span className="fieldLabel">{t("lifeStoryTitleLabel")}</span>
            <input
              className="input"
              type="text"
              maxLength={200}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>

          <label className="field">
            <span className="fieldLabel">{t("lifeStoryBodyLabel")}</span>
            <textarea
              className="input"
              rows={14}
              maxLength={50_000}
              value={body}
              onChange={(event) => setBody(event.target.value)}
            />
          </label>

          <div className="ritualChoices">
            <button
              type="button"
              className="button buttonPrimary"
              disabled={saving || !dirty || body.trim().length === 0}
              onClick={saveDraft}
            >
              {saving ? common("loading") : common("save")}
            </button>
          </div>
        </section>
      ) : null}

    </div>
  );
}

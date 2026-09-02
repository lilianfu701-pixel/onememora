"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

const RELATIONSHIPS = ["spouse", "parent", "child", "sibling"] as const;

/** The narrow set maps onto the existing relationshipSpouse/Parent/… labels. */
const RELATION_LABEL: Record<string, string> = {
  spouse: "relationshipSpouse",
  parent: "relationshipParent",
  child: "relationshipChild",
  sibling: "relationshipSibling",
};

type MyRequest = {
  id: string;
  status: "pending" | "accepted" | "declined" | "escalated" | "withdrawn";
  canEscalate: boolean;
};

/**
 * On the public page, a signed-in visitor who does not manage this memorial can
 * ask to take it over when its admin is unreachable — or, if they already have,
 * see the request's state and escalate it once the grace period has passed.
 */
export function TakeoverPanel(props: {
  memorialId: string;
  graceDays: number;
  mine: MyRequest | null;
}) {
  const t = useTranslations("memorial");
  const common = useTranslations("common");
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [relationship, setRelationship] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(): Promise<void> {
    if (busy) return;
    if (!relationship) {
      setError(t("takeoverNeedsRelationship"));
      return;
    }
    if (reason.trim().length === 0) {
      setError(t("takeoverNeedsReason"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/memorials/${props.memorialId}/takeover`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ relationship, reason: reason.trim() }),
      });
      if (res.ok) {
        router.refresh();
        return;
      }
      setError(t("takeoverSubmitFailed"));
    } catch {
      setError(t("takeoverSubmitFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function escalate(id: string): Promise<void> {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/memorials/${props.memorialId}/takeover/${id}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "escalate" }),
        },
      );
      if (res.ok) router.refresh();
    } catch {
      /* leave state; the requester can retry */
    } finally {
      setBusy(false);
    }
  }

  // An existing request: show its state rather than the apply form.
  if (props.mine) {
    if (props.mine.status === "pending") {
      return (
        <div className="takeoverPanel stack">
          <p className="muted" style={{ margin: 0 }}>
            {t("takeoverPending")}
          </p>
          {props.mine.canEscalate ? (
            <button
              type="button"
              className="button buttonQuiet buttonCompact"
              disabled={busy}
              onClick={() => escalate(props.mine!.id)}
            >
              {busy ? common("loading") : t("takeoverEscalateButton")}
            </button>
          ) : (
            <p className="muted" style={{ margin: 0 }}>
              {t("takeoverGraceNote", { days: props.graceDays })}
            </p>
          )}
        </div>
      );
    }
    if (props.mine.status === "escalated") {
      return (
        <p className="muted takeoverPanel">{t("takeoverStatusEscalated")}</p>
      );
    }
    if (props.mine.status === "declined") {
      return (
        <p className="muted takeoverPanel">{t("takeoverStatusDeclined")}</p>
      );
    }
    return null;
  }

  if (!open) {
    return (
      <div className="takeoverPanel">
        <button
          type="button"
          className="linkButton"
          onClick={() => setOpen(true)}
        >
          {t("takeoverApply")}
        </button>
      </div>
    );
  }

  return (
    <div className="takeoverPanel stack">
      <p className="muted" style={{ margin: 0 }}>
        {t("takeoverApplyHint", { days: props.graceDays })}
      </p>
      <label className="field">
        <span className="fieldLabel">{t("relationshipLabel")}</span>
        <select
          className="input"
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
        >
          <option value="">—</option>
          {RELATIONSHIPS.map((r) => (
            <option value={r} key={r}>
              {t(RELATION_LABEL[r]!)}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="fieldLabel">{t("takeoverReasonLabel")}</span>
        <textarea
          className="input"
          rows={3}
          maxLength={2000}
          placeholder={t("takeoverReasonPlaceholder")}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      {error ? (
        <p className="fieldError" role="alert">
          {error}
        </p>
      ) : null}
      <div className="adminHeadRow">
        <button
          type="button"
          className="button buttonPrimary buttonCompact"
          disabled={busy}
          onClick={submit}
        >
          {busy ? common("loading") : t("takeoverSubmit")}
        </button>
        <button
          type="button"
          className="button buttonQuiet buttonCompact"
          onClick={() => setOpen(false)}
        >
          {common("cancel")}
        </button>
      </div>
    </div>
  );
}

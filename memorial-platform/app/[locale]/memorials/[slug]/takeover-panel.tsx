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

type Kind = "takeover" | "join";

type MyRequest = {
  id: string;
  kind: Kind;
  status: "pending" | "accepted" | "declined" | "escalated" | "withdrawn";
  canEscalate: boolean;
};

/**
 * On the public page, a signed-in visitor who does not manage this memorial can
 * ask to **take over** an unreachable admin's page, or ask to **join** as a
 * co-manager. If they already have a request, its state is shown instead.
 */
export function TakeoverPanel(props: {
  memorialId: string;
  graceDays: number;
  mine: MyRequest | null;
}) {
  const t = useTranslations("memorial");
  const common = useTranslations("common");
  const router = useRouter();

  const [mode, setMode] = useState<Kind | null>(null);
  const [relationship, setRelationship] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(): Promise<void> {
    if (busy || !mode) return;
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
        body: JSON.stringify({ relationship, reason: reason.trim(), kind: mode }),
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
    const join = props.mine.kind === "join";
    if (props.mine.status === "pending") {
      return (
        <span className="takeoverPanel">
          <span className="muted">
            {join ? t("joinPending") : t("takeoverPending")}
          </span>
          {props.mine.canEscalate ? (
            <button
              type="button"
              className="button buttonQuiet buttonCompact"
              disabled={busy}
              onClick={() => escalate(props.mine!.id)}
            >
              {busy ? common("loading") : t("takeoverEscalateButton")}
            </button>
          ) : null}
        </span>
      );
    }
    if (props.mine.status === "escalated") {
      return (
        <span className="muted takeoverPanel">{t("takeoverStatusEscalated")}</span>
      );
    }
    if (props.mine.status === "declined") {
      return (
        <span className="muted takeoverPanel">
          {join ? t("joinStatusDeclined") : t("takeoverStatusDeclined")}
        </span>
      );
    }
    return null;
  }

  if (!mode) {
    return (
      <span className="takeoverPanel">
        <button
          type="button"
          className="linkButton"
          onClick={() => setMode("join")}
        >
          {t("joinApply")}
        </button>
        <button
          type="button"
          className="linkButton"
          onClick={() => setMode("takeover")}
        >
          {t("takeoverApply")}
        </button>
      </span>
    );
  }

  return (
    <div className="takeoverPanel takeoverForm stack">
      <p className="muted" style={{ margin: 0 }}>
        {mode === "join"
          ? t("joinApplyHint")
          : t("takeoverApplyHint", { days: props.graceDays })}
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
          onClick={() => setMode(null)}
        >
          {common("cancel")}
        </button>
      </div>
    </div>
  );
}

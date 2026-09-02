"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function TransferOwnership(props: { memorialId: string }) {
  const t = useTranslations("memorial");
  const common = useTranslations("common");
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  function errorFor(code: string | undefined): string {
    if (code === "TARGET_NOT_REGISTERED")
      return t("ownershipErrTargetNotRegistered");
    if (code === "SELF") return t("ownershipErrSelf");
    return t("ownershipErrGeneric");
  }

  async function transfer(): Promise<void> {
    if (state === "sending" || email.trim().length === 0) return;
    setState("sending");
    setMessage(null);
    try {
      const res = await fetch(
        `/api/memorials/${props.memorialId}/transfer`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        },
      );
      if (res.ok) {
        setState("done");
        setMessage(t("ownershipTransferDone"));
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => null);
      setState("error");
      setMessage(errorFor(data?.error?.fieldErrors?.reason?.[0]));
    } catch {
      setState("error");
      setMessage(t("ownershipErrGeneric"));
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="stack">
      <h2>{t("ownershipTransferHeading")}</h2>
      <p className="muted" style={{ margin: 0 }}>
        {t("ownershipTransferHint")}
      </p>
      <label className="field">
        <span className="fieldLabel">{t("ownershipTransferEmailLabel")}</span>
        <input
          className="input"
          type="email"
          value={email}
          placeholder="name@example.com"
          onChange={(e) => {
            setEmail(e.target.value);
            setConfirming(false);
            setState("idle");
          }}
        />
      </label>

      {message ? (
        <p className={state === "done" ? "notice" : "fieldError"} role="alert">
          {message}
        </p>
      ) : null}

      {confirming ? (
        <div className="adminHeadRow">
          <button
            type="button"
            className="button buttonPrimary buttonCompact"
            disabled={state === "sending"}
            onClick={transfer}
          >
            {state === "sending" ? common("loading") : t("ownershipTransferConfirm")}
          </button>
          <button
            type="button"
            className="button buttonQuiet buttonCompact"
            onClick={() => setConfirming(false)}
          >
            {common("cancel")}
          </button>
        </div>
      ) : (
        <div>
          <button
            type="button"
            className="button buttonQuiet buttonCompact"
            disabled={email.trim().length === 0}
            onClick={() => setConfirming(true)}
          >
            {t("ownershipTransferButton")}
          </button>
        </div>
      )}
    </div>
  );
}

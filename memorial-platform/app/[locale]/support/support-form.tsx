"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

/** ¥9.9 floor, mirrored on the server. */
const MIN_YUAN = 9.9;

/**
 * Custom-amount input + PayPal button for funding the platform. On success the
 * server returns a PayPal approval URL and we hand the browser to it; the payer
 * comes back to /support?state=thanks.
 */
export function SupportForm({ locale }: { locale: string }) {
  const t = useTranslations("platformSupport");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const yuan = Number.parseFloat(amount);
  const valid = Number.isFinite(yuan) && yuan >= MIN_YUAN;

  async function pay(): Promise<void> {
    if (sending || !valid) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/platform-support", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          amountMinor: Math.round(yuan * 100),
          locale,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.data?.url) {
        const code = data?.error?.code;
        setError(code === "FEATURE_DISABLED" ? t("unavailable") : t("failed"));
        return;
      }
      window.location.href = data.data.url;
    } catch {
      setError(t("failed"));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="stack measure">
      <label className="field">
        <span className="fieldLabel">{t("amountLabel")}</span>
        <div className="amountRow">
          <span className="amountPrefix" aria-hidden="true">
            ¥
          </span>
          <input
            className="input"
            type="number"
            inputMode="decimal"
            min={MIN_YUAN}
            step="0.01"
            value={amount}
            placeholder="9.9"
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <span className="fieldHint">{t("amountHint")}</span>
      </label>

      <div>
        <button
          type="button"
          className="button buttonPrimary"
          disabled={sending || !valid}
          onClick={pay}
        >
          {sending ? t("redirecting") : t("pay")}
        </button>
      </div>

      {error ? (
        <p className="fieldError" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

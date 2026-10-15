"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { PaymentProvider } from "@/lib/payment-providers";

/** ¥9.9 floor, mirrored on the server. */
const MIN_YUAN = 9.9;

/**
 * Custom-amount input + one pay button per configured provider (Stripe for
 * card/Alipay/WeChat Pay, PayPal) for funding the platform. On success the
 * server returns the provider's checkout URL and we hand the browser to it;
 * the payer comes back to /support?state=thanks.
 */
export function SupportForm({
  locale,
  providers,
}: {
  locale: string;
  providers: readonly PaymentProvider[];
}) {
  const t = useTranslations("platformSupport");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState<PaymentProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const yuan = Number.parseFloat(amount);
  const valid = Number.isFinite(yuan) && yuan >= MIN_YUAN;
  // With nothing configured, keep the PayPal button so the server's
  // "not enabled" answer is what the visitor sees.
  const buttons: readonly PaymentProvider[] =
    providers.length > 0 ? providers : ["paypal"];

  async function pay(provider: PaymentProvider): Promise<void> {
    if (sending || !valid) return;
    setSending(provider);
    setError(null);
    try {
      const res = await fetch("/api/platform-support", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          amountMinor: Math.round(yuan * 100),
          locale,
          provider,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.data?.url) {
        const code = data?.error?.code;
        setError(code === "FEATURE_DISABLED" ? t("unavailable") : t("failed"));
        return;
      }
      window.location.assign(data.data.url);
    } catch {
      setError(t("failed"));
    } finally {
      setSending(null);
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

      <div className="supportPayButtons">
        {buttons.map((p, i) => (
          <button
            key={p}
            type="button"
            className={`button ${i === 0 ? "buttonPrimary" : "buttonQuiet"}`}
            disabled={sending !== null || !valid}
            onClick={() => pay(p)}
          >
            {sending === p
              ? t("redirecting")
              : p === "stripe"
                ? t("payStripe")
                : t("pay")}
          </button>
        ))}
      </div>

      {error ? (
        <p className="fieldError" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

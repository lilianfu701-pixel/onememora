"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OfferingSummary } from "@/modules/offerings/display";

/* ────────────── SVG icons ────────────── */

function IncenseIcon() {
  return (
    <svg
      className="altarItemSvg"
      viewBox="0 0 80 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <ellipse cx="40" cy="95" rx="28" ry="6" fill="#8b6914" opacity="0.18" />
      <path
        d="M18 82c0 8 10 14 22 14s22-6 22-14"
        stroke="#8b6914"
        strokeWidth="2"
        fill="none"
      />
      <rect x="16" y="78" width="48" height="6" rx="3" fill="#c5a35f" />
      <rect x="20" y="84" width="40" height="8" rx="2" fill="#b8960b" />
      <ellipse cx="40" cy="78" rx="22" ry="3" fill="#d4c8a0" />
      <line x1="32" y1="76" x2="32" y2="24" stroke="#8b6914" strokeWidth="1.8" />
      <line x1="40" y1="76" x2="40" y2="20" stroke="#8b6914" strokeWidth="1.8" />
      <line x1="48" y1="76" x2="48" y2="24" stroke="#8b6914" strokeWidth="1.8" />
      <circle cx="32" cy="24" r="2.5" fill="#e67e22">
        <animate attributeName="r" values="2;3;2" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="40" cy="20" r="2.5" fill="#e67e22">
        <animate attributeName="r" values="2.5;3.2;2.5" dur="1.8s" repeatCount="indefinite" />
      </circle>
      <circle cx="48" cy="24" r="2.5" fill="#e67e22">
        <animate attributeName="r" values="2;2.8;2" dur="2.2s" repeatCount="indefinite" />
      </circle>
      <path d="M32 22c-2-8-4-14 0-20" stroke="#9e9e8e" strokeWidth="1" opacity="0.3" fill="none">
        <animate attributeName="opacity" values="0.3;0.1;0.3" dur="3s" repeatCount="indefinite" />
      </path>
      <path d="M40 18c1-6 3-12 0-18" stroke="#9e9e8e" strokeWidth="1.2" opacity="0.25" fill="none">
        <animate attributeName="opacity" values="0.25;0.08;0.25" dur="2.6s" repeatCount="indefinite" />
      </path>
      <path d="M48 22c2-7 3-13-1-19" stroke="#9e9e8e" strokeWidth="1" opacity="0.3" fill="none">
        <animate attributeName="opacity" values="0.3;0.12;0.3" dur="3.2s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}

/** Lotus votive candle — a warm glass cup cradled in lotus petals. */
function CandleIcon() {
  return (
    <svg
      className="altarItemSvg"
      viewBox="0 0 48 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* halo */}
      <circle cx="24" cy="30" r="13" fill="#fcd34d" opacity="0.12">
        <animate attributeName="r" values="13;16;13" dur="2s" repeatCount="indefinite" />
      </circle>
      {/* flame */}
      <ellipse cx="24" cy="30" rx="4.6" ry="10.5" fill="#f59e0b" opacity="0.92">
        <animate attributeName="ry" values="10.5;12;9.8;10.5" dur="0.9s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="24" cy="31" rx="2.4" ry="5.8" fill="#fef3c7" opacity="0.9" />
      <line x1="24" y1="41" x2="24" y2="34" stroke="#5b5147" strokeWidth="1" />
      {/* candle body */}
      <rect x="18" y="41" width="12" height="17" rx="1.5" fill="#fbe4c6" />
      <rect x="18" y="41" width="4.5" height="17" fill="#ffffff" opacity="0.3" />
      {/* glass cup */}
      <path
        d="M13 57 H35 L32.5 82 Q32 87 27 87 H21 Q16 87 15.5 82 Z"
        fill="#fde68a"
        opacity="0.22"
        stroke="#e6c67a"
        strokeWidth="1"
      />
      {/* lotus petals */}
      <ellipse cx="24" cy="88" rx="18" ry="5" fill="#dda0aa" opacity="0.14" />
      <path d="M24 90 C15 86 13 79 16 74 C21 79 24 83 24 90 Z" fill="#f7cdd4" />
      <path d="M24 90 C33 86 35 79 32 74 C27 79 24 83 24 90 Z" fill="#f4bcc6" />
      <path d="M24 91 C19 85 18 79 21 75 C24 80 25 84 24 91 Z" fill="#fbe0e4" />
      <path d="M24 91 C29 85 30 79 27 75 C24 80 23 84 24 91 Z" fill="#fbe0e4" />
      <path d="M24 92 C22 87 22 82 24 78 C26 82 26 87 24 92 Z" fill="#fff2f4" />
    </svg>
  );
}

/** Chrysanthemum funeral wreath on a stand, ribbons hanging. */
function WreathIcon() {
  const cx = 60;
  const cy = 54;
  const radius = 38;
  const clusters = Array.from({ length: 16 }, (_, i) => {
    const angle = (i / 16) * Math.PI * 2 - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      pale: i % 2 === 0,
    };
  });

  return (
    <svg
      className="altarItemSvg altarItemSvgWreath"
      viewBox="0 0 120 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* stand */}
      <line x1="60" y1="92" x2="40" y2="150" stroke="#8a7a5c" strokeWidth="2.5" />
      <line x1="60" y1="92" x2="80" y2="150" stroke="#8a7a5c" strokeWidth="2.5" />
      <line x1="40" y1="150" x2="80" y2="150" stroke="#8a7a5c" strokeWidth="2" />
      {/* green ring */}
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#4a7c4a" strokeWidth="13" opacity="0.55" />
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#6aa06a" strokeWidth="7" opacity="0.4" />
      {/* ribbons (挽联 text is shown below the card, so these stay decorative) */}
      <rect x="47" y="50" width="11" height="62" rx="1" fill="#f7f2e4" stroke="#c5a35f" strokeWidth="0.6" />
      <rect x="62" y="50" width="11" height="62" rx="1" fill="#f7f2e4" stroke="#c5a35f" strokeWidth="0.6" />
      <line x1="52.5" y1="58" x2="52.5" y2="106" stroke="#c9b48a" strokeWidth="0.6" opacity="0.5" strokeDasharray="1 4" />
      <line x1="67.5" y1="58" x2="67.5" y2="106" stroke="#c9b48a" strokeWidth="0.6" opacity="0.5" strokeDasharray="1 4" />
      {/* chrysanthemum clusters */}
      {clusters.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y} r="6" fill={c.pale ? "#fbfaf3" : "#f3e2a0"} />
          <circle cx={c.x} cy={c.y} r="5" fill="none" stroke={c.pale ? "#e9e2c8" : "#e0cd82"} strokeWidth="0.8" />
          <circle cx={c.x} cy={c.y} r="1.8" fill="#d3ac47" />
        </g>
      ))}
    </svg>
  );
}

/* ────────────── Display: 功德簿 ────────────── */

function MeritBook(props: {
  donors: { name: string | null; amountMinor: number; createdAt: Date }[];
  total: number;
  totalAmount: number;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
}) {
  if (props.total === 0) return null;

  const tierOf = (amt: number) => {
    if (amt >= 199900) return "meritBookGold";
    if (amt >= 99900) return "meritBookSilver";
    return "meritBookBronze";
  };

  const formatAmount = (amt: number) => `¥${(amt / 100).toFixed(0)}`;
  const shouldScroll = props.donors.length > 5;

  const renderEntry = (
    d: (typeof props.donors)[number],
    i: number,
    prefix = "",
  ) => (
    <div
      key={`${prefix}${i}`}
      className={`meritBookEntry ${tierOf(d.amountMinor)}`}
    >
      <span className="meritBookName">
        {d.name ? d.name : props.t("anonymousDonor")}
      </span>
      <span className="meritBookAmount">{formatAmount(d.amountMinor)}</span>
    </div>
  );

  return (
    <div className="meritBook">
      <div className="meritBookHeader">
        <span className="meritBookTitle">{props.t("donorWallTitle")}</span>
        <span className="meritBookTotal">
          {props.t("donorWallTotal", {
            amount: (props.totalAmount / 100).toFixed(0),
          })}
        </span>
      </div>
      <div className="meritBookViewport">
        <div
          className={`meritBookTrack${shouldScroll ? " meritBookScrolling" : ""}`}
          style={
            shouldScroll
              ? ({ "--scroll-count": props.donors.length } as React.CSSProperties)
              : undefined
          }
        >
          {props.donors.map((d, i) => renderEntry(d, i))}
          {shouldScroll ? (
            <div aria-hidden="true">
              {props.donors.map((d, i) => renderEntry(d, i, "dup-"))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ────────────── Display: 大香炉 ────────────── */

function CenserSvg(props: { count: number }) {
  const maxVisible = 21;
  const visible = Math.min(props.count, maxVisible);

  const sticks: Array<{ x: number; h: number; delay: string }> = [];
  const left = 62;
  const right = 178;
  const range = right - left;

  if (visible <= 3) {
    const gap = 20;
    const start = 120 - ((visible - 1) * gap) / 2;
    for (let i = 0; i < visible; i++) {
      sticks.push({
        x: start + i * gap,
        h: 50 + (i % 3) * 6,
        delay: `${i * 0.5}s`,
      });
    }
  } else {
    for (let i = 0; i < visible; i++) {
      const t = (i + 0.5) / visible;
      sticks.push({
        x: left + t * range,
        h: 44 + ((i * 7 + 3) % 14),
        delay: `${((i * 0.3) % 3).toFixed(1)}s`,
      });
    }
  }

  return (
    <svg
      className="altarCenserSvg"
      viewBox="0 0 240 155"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <filter id="censerSmoke" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.7" />
        </filter>
      </defs>
      <ellipse cx="120" cy="148" rx="72" ry="5" fill="#8b6914" opacity="0.1" />
      <rect x="80" y="130" width="5" height="12" rx="1" fill="#7a6035" />
      <rect x="118" y="130" width="5" height="12" rx="1" fill="#7a6035" />
      <rect x="156" y="130" width="5" height="12" rx="1" fill="#7a6035" />
      <path d="M58 88 Q58 130 82 130 L158 130 Q182 130 182 88" fill="#a08040" />
      <rect x="58" y="88" width="124" height="4" rx="0" fill="rgba(255,255,255,0.08)" />
      <rect x="65" y="105" width="110" height="3" rx="1.5" fill="#c5a35f" opacity="0.35" />
      <ellipse cx="120" cy="88" rx="68" ry="10" fill="#c5a35f" />
      <ellipse cx="120" cy="86" rx="64" ry="8" fill="#b89840" />
      <ellipse cx="120" cy="86" rx="56" ry="5" fill="#d4c8a0" />
      <circle cx="46" cy="104" r="7" stroke="#c5a35f" strokeWidth="2" fill="none" />
      <circle cx="194" cy="104" r="7" stroke="#c5a35f" strokeWidth="2" fill="none" />
      {sticks.map((s, i) => (
        <g key={i}>
          <line x1={s.x} y1={82} x2={s.x} y2={82 - s.h} stroke="#8b6914" strokeWidth="1.5" />
          <circle cx={s.x} cy={82 - s.h} r="2" fill="#e67e22">
            <animate attributeName="r" values="1.5;2.5;1.5" dur="2s" begin={s.delay} repeatCount="indefinite" />
          </circle>
        </g>
      ))}
      {/* Smoke rising gently from the censer — soft, blurred wisps that drift
          upward, sway a little and fade near the top. */}
      {[
        { x: 104, base: 72, begin: "0s", dur: "6.5s" },
        { x: 121, base: 68, begin: "2.1s", dur: "7.4s" },
        { x: 138, base: 73, begin: "4.3s", dur: "6.8s" },
      ].map((w, i) => (
        <g key={`smoke-${i}`} transform={`translate(${w.x} ${w.base})`}>
          <g opacity="0">
            <path
              d="M0 0 q -6 -11 0 -22 q 6 -11 0 -22 q -5 -9 0 -18"
              stroke="#cbc6bb"
              strokeWidth="2.6"
              strokeLinecap="round"
              fill="none"
              filter="url(#censerSmoke)"
            />
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0 0; -5 -34; 4 -70"
              keyTimes="0;0.5;1"
              dur={w.dur}
              begin={w.begin}
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0;0.28;0.2;0"
              keyTimes="0;0.28;0.7;1"
              dur={w.dur}
              begin={w.begin}
              repeatCount="indefinite"
            />
          </g>
        </g>
      ))}
    </svg>
  );
}

/* ────────────── Display: 蜡烛组 ────────────── */

function CandleGroup(props: {
  candles: { name: string | null; createdAt: Date }[];
}) {
  if (props.candles.length === 0) return null;
  return (
    <div className="altarCandleSide">
      {props.candles.map((c, i) => (
        <div key={i} className="altarCandleUnit">
          <CandleIcon />
          {c.name ? <span className="altarCandleName">{c.name}</span> : null}
        </div>
      ))}
    </div>
  );
}

/* ────────────── Display: 花圈 ────────────── */

function WreathGallery(props: {
  wreaths: { name: string | null; message: string | null; createdAt: Date }[];
  total: number;
}) {
  if (props.total === 0) return null;
  return (
    <div className="altarWreathGrid">
      {props.wreaths.slice(0, 4).map((w, i) => (
        <div key={i} className="altarWreathCard">
          <WreathIcon />
          {w.message ? <p className="altarWreathEulogy">{w.message}</p> : null}
          {w.name ? <span className="altarWreathGiver">—— {w.name}</span> : null}
        </div>
      ))}
    </div>
  );
}

/* ────────────── Offering modal ────────────── */

type OfferKind = "candle" | "wreath" | "donation";

const DONATION_TIERS = [
  { amount: 199, key: "donate199" },
  { amount: 999, key: "donate999" },
  { amount: 1999, key: "donate1999" },
] as const;

/* ────────────── Main ────────────── */

export function OfferingsAltar(props: {
  memorialId: string;
  summary: OfferingSummary;
  isLoggedIn: boolean;
}) {
  const t = useTranslations("offerings");
  const router = useRouter();
  const { summary } = props;

  const [modal, setModal] = useState<OfferKind | null>(null);
  const [name, setName] = useState("");
  const [masked, setMasked] = useState(true);
  const [message, setMessage] = useState("");
  const [amountYuan, setAmountYuan] = useState("199");
  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState<"ok" | "fail" | null>(null);

  const hasAnything =
    summary.incense > 0 ||
    summary.candle > 0 ||
    summary.wreath > 0 ||
    summary.donation > 0;

  const mid = Math.ceil(summary.recentCandles.length / 2);
  const leftCandles = summary.recentCandles.slice(0, mid);
  const rightCandles = summary.recentCandles.slice(mid);

  async function post(payload: Record<string, unknown>, tag: string): Promise<boolean> {
    setPending(tag);
    setNotice(null);
    try {
      const res = await fetch(`/api/memorials/${props.memorialId}/offerings`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setNotice("fail");
        return false;
      }
      setNotice("ok");
      router.refresh();
      return true;
    } catch {
      setNotice("fail");
      return false;
    } finally {
      setPending(null);
    }
  }

  function openModal(kind: OfferKind, presetAmount?: number): void {
    setName("");
    setMasked(true);
    setMessage(kind === "wreath" ? t("eulogyDefault") : "");
    if (kind === "donation") setAmountYuan(String(presetAmount ?? 199));
    setNotice(null);
    setModal(kind);
  }

  async function offerIncense(): Promise<void> {
    await post({ slug: "incense" }, "incense");
  }

  async function submitModal(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!modal || pending) return;

    if (modal === "candle") {
      const ok = await post(
        { slug: "candle", name: name.trim() || undefined, masked },
        "candle",
      );
      if (ok) setModal(null);
      return;
    }
    if (modal === "wreath") {
      const ok = await post(
        {
          slug: "wreath",
          name: name.trim() || undefined,
          message: message.trim() || undefined,
        },
        "wreath",
      );
      if (ok) setModal(null);
      return;
    }
    // donation
    const yuan = Number(amountYuan);
    if (!Number.isFinite(yuan) || yuan <= 0) {
      setNotice("fail");
      return;
    }
    const ok = await post(
      {
        slug: "donation",
        name: name.trim() || undefined,
        message: message.trim() || undefined,
        masked,
        amountMinor: Math.round(yuan * 100),
      },
      "donation",
    );
    if (ok) setModal(null);
  }

  return (
    <section className="altarSection" aria-label={t("altarHeading")}>
      <h2 className="altarHeading">{t("altarHeading")}</h2>

      {hasAnything ? (
        <>
          <MeritBook
            donors={summary.recentDonations}
            total={summary.donation}
            totalAmount={summary.donationTotal}
            t={t}
          />

          <WreathGallery wreaths={summary.recentWreaths} total={summary.wreath} />

          {(summary.incense > 0 || summary.candle > 0) && (
            <div className="altarPlatform">
              <CandleGroup candles={leftCandles} />
              {summary.incense > 0 && (
                <div className="altarCenserWrap">
                  <CenserSvg count={summary.incense} />
                  <span className="altarCenserCount">
                    {t("incenseCount", { count: summary.incense })}
                  </span>
                </div>
              )}
              <CandleGroup candles={rightCandles} />
            </div>
          )}
        </>
      ) : null}

      {notice === "ok" ? (
        <p className="altarNotice" role="status">
          {t("offerThanks")}
        </p>
      ) : null}
      {notice === "fail" ? (
        <p className="altarNoticeFail" role="alert">
          {t("offerFailed")}
        </p>
      ) : null}

      {/* Offering actions */}
      <div className="altarActions">
        <button
          type="button"
          className="altarActionBtn"
          onClick={offerIncense}
          disabled={pending === "incense"}
        >
          <IncenseIcon />
          <span className="altarActionLabel">{t("offerIncense")}</span>
          <span className="altarActionDesc">{t("descIncense")}</span>
        </button>

        <button
          type="button"
          className="altarActionBtn"
          onClick={() => openModal("candle")}
        >
          <CandleIcon />
          <span className="altarActionLabel">{t("offerCandle")}</span>
          <span className="altarActionDesc">{t("descCandle")}</span>
        </button>

        <button
          type="button"
          className="altarActionBtn"
          onClick={() => openModal("wreath")}
        >
          <WreathIcon />
          <span className="altarActionLabel">{t("offerWreath")}</span>
          <span className="altarActionDesc">{t("descWreath")}</span>
        </button>
      </div>

      {/* Donation */}
      <div className="altarDonationTiers">
        <h3 className="altarDonationTitle">{t("donateTitle")}</h3>
        <div className="altarDonationGrid">
          {DONATION_TIERS.map((tier) => (
            <button
              key={tier.amount}
              type="button"
              className="altarDonationBtn"
              onClick={() => openModal("donation", tier.amount)}
            >
              <span className="altarDonationAmount">¥{tier.amount}</span>
              <span className="altarDonationDesc">{t(tier.key)}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="altarDonationCustom"
          onClick={() => openModal("donation", 0)}
        >
          {t("donateCustom")}
        </button>
        <p className="altarFeeNote">{t("feeTransfer")}</p>
      </div>

      {/* Modal */}
      {modal ? (
        <div
          className="altarModalOverlay"
          role="dialog"
          aria-modal="true"
          aria-label={t(
            modal === "candle"
              ? "modalCandleTitle"
              : modal === "wreath"
                ? "modalWreathTitle"
                : "modalDonateTitle",
          )}
          onClick={(e) => {
            if (e.target === e.currentTarget && !pending) setModal(null);
          }}
        >
          <form className="altarModalCard" onSubmit={submitModal}>
            <div className="altarModalIcon">
              {modal === "candle" ? <CandleIcon /> : null}
              {modal === "wreath" ? <WreathIcon /> : null}
            </div>
            <h3 className="altarModalTitle">
              {modal === "candle"
                ? t("modalCandleTitle")
                : modal === "wreath"
                  ? t("modalWreathTitle")
                  : t("modalDonateTitle")}
            </h3>

            {modal === "donation" ? (
              <label className="altarField">
                <span className="altarFieldLabel">{t("fieldAmount")}</span>
                <input
                  className="altarInput"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  value={amountYuan}
                  onChange={(e) => setAmountYuan(e.target.value)}
                  required
                  autoFocus
                />
              </label>
            ) : null}

            {modal === "wreath" ? (
              <label className="altarField">
                <span className="altarFieldLabel">{t("fieldEulogy")}</span>
                <textarea
                  className="altarInput"
                  rows={2}
                  maxLength={30}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t("eulogyDefault")}
                  autoFocus
                />
                <span className="altarFieldHint">{message.length}/30</span>
              </label>
            ) : null}

            <label className="altarField">
              <span className="altarFieldLabel">
                {modal === "candle" ? t("fieldNameLabel") : t("fieldNameOptional")}
              </span>
              <input
                className="altarInput"
                type="text"
                maxLength={40}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>

            {modal === "donation" ? (
              <label className="altarField">
                <span className="altarFieldLabel">{t("fieldBlessing")}</span>
                <textarea
                  className="altarInput"
                  rows={2}
                  maxLength={200}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </label>
            ) : null}

            {modal !== "wreath" ? (
              <label className="altarCheck">
                <input
                  type="checkbox"
                  checked={masked}
                  onChange={(e) => setMasked(e.target.checked)}
                />
                <span>{t("maskOption")}</span>
              </label>
            ) : null}

            <p className="altarDevNote">{t("devSkipNote")}</p>

            {notice === "fail" ? (
              <p className="altarNoticeFail" role="alert">
                {t("offerFailed")}
              </p>
            ) : null}

            <div className="altarModalActions">
              <button
                type="button"
                className="button buttonQuiet"
                onClick={() => setModal(null)}
                disabled={pending !== null}
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                className="button buttonPrimary"
                disabled={pending !== null}
              >
                {pending
                  ? t("lightingUp")
                  : modal === "donation"
                    ? t("submitDonate")
                    : t("submitOffer")}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}

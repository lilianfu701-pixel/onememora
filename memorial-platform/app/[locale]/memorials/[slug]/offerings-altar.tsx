"use client";

import { useTranslations } from "next-intl";
import type { OfferingSummary } from "@/modules/offerings/display";

function maskName(name: string): string {
  if (name.length <= 1) return name;
  if (name.length === 2) return name[0] + "*";
  return name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
}

/* ────────────── SVG icons (action buttons) ────────────── */

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

function CandleIcon() {
  return (
    <svg
      className="altarItemSvg"
      viewBox="0 0 40 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <ellipse cx="20" cy="92" rx="14" ry="3" fill="#8b6914" opacity="0.12" />
      <rect x="12" y="40" width="16" height="52" rx="2" fill="#c41e1e" />
      <rect x="12" y="40" width="7" height="52" rx="2" fill="#d42a2a" opacity="0.25" />
      <circle cx="14" cy="56" r="1.5" fill="#d42a2a" opacity="0.6" />
      <circle cx="27" cy="64" r="1.2" fill="#d42a2a" opacity="0.5" />
      <line x1="20" y1="40" x2="20" y2="28" stroke="#3a3a3a" strokeWidth="1" />
      <ellipse cx="20" cy="24" rx="5" ry="10" fill="#fbbf24" opacity="0.9">
        <animate attributeName="ry" values="10;11;9.5;10" dur="0.8s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="20" cy="23" rx="3" ry="6" fill="#fef3c7" opacity="0.8" />
      <circle cx="20" cy="24" r="12" fill="#fbbf24" opacity="0.08">
        <animate attributeName="r" values="12;14;12" dur="1.5s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function WreathIcon() {
  return (
    <svg
      className="altarItemSvg altarItemSvgWreath"
      viewBox="0 0 120 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <line x1="60" y1="130" x2="40" y2="155" stroke="#7a6a4f" strokeWidth="2" />
      <line x1="60" y1="130" x2="80" y2="155" stroke="#7a6a4f" strokeWidth="2" />
      <line x1="60" y1="80" x2="60" y2="135" stroke="#7a6a4f" strokeWidth="2" />
      <circle cx="60" cy="52" r="38" stroke="#3d6b3d" strokeWidth="14" fill="none" opacity="0.7" />
      <circle cx="60" cy="52" r="38" stroke="#5a9a5a" strokeWidth="8" fill="none" opacity="0.5" />
      <circle cx="60" cy="14" r="3" fill="#e8e0d0" opacity="0.7" />
      <circle cx="32" cy="28" r="2.5" fill="#f5e6d0" opacity="0.6" />
      <circle cx="88" cy="28" r="2.5" fill="#f5e6d0" opacity="0.6" />
      <circle cx="26" cy="55" r="3" fill="#e8e0d0" opacity="0.7" />
      <circle cx="94" cy="55" r="3" fill="#e8e0d0" opacity="0.7" />
      <circle cx="35" cy="78" r="2.5" fill="#f5e6d0" opacity="0.6" />
      <circle cx="85" cy="78" r="2.5" fill="#f5e6d0" opacity="0.6" />
      <circle cx="60" cy="90" r="3" fill="#e8e0d0" opacity="0.7" />
      <rect x="38" y="75" width="12" height="50" rx="1" fill="#f5f0e0" stroke="#c5a35f" strokeWidth="0.5" />
      <text x="44" y="88" fontSize="7" fill="#3a3a3a" textAnchor="middle" fontFamily="serif">沉</text>
      <text x="44" y="97" fontSize="7" fill="#3a3a3a" textAnchor="middle" fontFamily="serif">痛</text>
      <text x="44" y="106" fontSize="7" fill="#3a3a3a" textAnchor="middle" fontFamily="serif">悼</text>
      <text x="44" y="115" fontSize="7" fill="#3a3a3a" textAnchor="middle" fontFamily="serif">念</text>
      <rect x="70" y="75" width="12" height="50" rx="1" fill="#f5f0e0" stroke="#c5a35f" strokeWidth="0.5" />
      <text x="76" y="88" fontSize="7" fill="#3a3a3a" textAnchor="middle" fontFamily="serif">永</text>
      <text x="76" y="97" fontSize="7" fill="#3a3a3a" textAnchor="middle" fontFamily="serif">垂</text>
      <text x="76" y="106" fontSize="7" fill="#3a3a3a" textAnchor="middle" fontFamily="serif">不</text>
      <text x="76" y="115" fontSize="7" fill="#3a3a3a" textAnchor="middle" fontFamily="serif">朽</text>
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
        {d.name ? maskName(d.name) : props.t("anonymousDonor")}
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
      {/* Ground shadow */}
      <ellipse cx="120" cy="148" rx="72" ry="5" fill="#8b6914" opacity="0.1" />
      {/* Three legs */}
      <rect x="80" y="130" width="5" height="12" rx="1" fill="#7a6035" />
      <rect x="118" y="130" width="5" height="12" rx="1" fill="#7a6035" />
      <rect x="156" y="130" width="5" height="12" rx="1" fill="#7a6035" />
      {/* Body */}
      <path
        d="M58 88 Q58 130 82 130 L158 130 Q182 130 182 88"
        fill="#a08040"
      />
      <rect
        x="58"
        y="88"
        width="124"
        height="4"
        rx="0"
        fill="rgba(255,255,255,0.08)"
      />
      {/* Decorative band */}
      <rect
        x="65"
        y="105"
        width="110"
        height="3"
        rx="1.5"
        fill="#c5a35f"
        opacity="0.35"
      />
      {/* Rim */}
      <ellipse cx="120" cy="88" rx="68" ry="10" fill="#c5a35f" />
      <ellipse cx="120" cy="86" rx="64" ry="8" fill="#b89840" />
      {/* Ash bed */}
      <ellipse cx="120" cy="86" rx="56" ry="5" fill="#d4c8a0" />
      {/* Handles */}
      <circle
        cx="46"
        cy="104"
        r="7"
        stroke="#c5a35f"
        strokeWidth="2"
        fill="none"
      />
      <circle
        cx="194"
        cy="104"
        r="7"
        stroke="#c5a35f"
        strokeWidth="2"
        fill="none"
      />
      {/* Incense sticks */}
      {sticks.map((s, i) => (
        <g key={i}>
          <line
            x1={s.x}
            y1={82}
            x2={s.x}
            y2={82 - s.h}
            stroke="#8b6914"
            strokeWidth="1.5"
          />
          <circle cx={s.x} cy={82 - s.h} r="2" fill="#e67e22">
            <animate
              attributeName="r"
              values="1.5;2.5;1.5"
              dur="2s"
              begin={s.delay}
              repeatCount="indefinite"
            />
          </circle>
          <path
            d={`M${s.x} ${82 - s.h - 2}c${-2} ${-8} ${1} ${-14} ${-1} ${-20}`}
            stroke="#9e9e8e"
            strokeWidth="0.8"
            opacity="0.2"
            fill="none"
          >
            <animate
              attributeName="opacity"
              values="0.2;0.06;0.2"
              dur="3s"
              begin={s.delay}
              repeatCount="indefinite"
            />
          </path>
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
          {c.name ? (
            <span className="altarCandleName">{maskName(c.name)}</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/* ────────────── Display: 花圈 ────────────── */

function WreathGallery(props: {
  wreaths: {
    name: string | null;
    message: string | null;
    createdAt: Date;
  }[];
  total: number;
}) {
  if (props.total === 0) return null;
  return (
    <div className="altarWreathGrid">
      {props.wreaths.slice(0, 4).map((w, i) => (
        <div key={i} className="altarWreathCard">
          <WreathIcon />
          {w.message ? (
            <p className="altarWreathEulogy">{w.message}</p>
          ) : null}
          {w.name ? (
            <span className="altarWreathGiver">—— {w.name}</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/* ────────────── Main ────────────── */

const DONATION_TIERS = [
  { amount: 199, key: "donate199" },
  { amount: 999, key: "donate999" },
  { amount: 1999, key: "donate1999" },
] as const;

export function OfferingsAltar(props: {
  memorialId: string;
  summary: OfferingSummary;
  isLoggedIn: boolean;
}) {
  const t = useTranslations("offerings");
  const { summary } = props;

  const hasAnything =
    summary.incense > 0 ||
    summary.candle > 0 ||
    summary.wreath > 0 ||
    summary.donation > 0;

  const mid = Math.ceil(summary.recentCandles.length / 2);
  const leftCandles = summary.recentCandles.slice(0, mid);
  const rightCandles = summary.recentCandles.slice(mid);

  return (
    <section className="altarSection" aria-label={t("altarHeading")}>
      <h2 className="altarHeading">{t("altarHeading")}</h2>

      {hasAnything ? (
        <>
          {/* 功德簿 — most prominent */}
          <MeritBook
            donors={summary.recentDonations}
            total={summary.donation}
            totalAmount={summary.donationTotal}
            t={t}
          />

          {/* 花圈 with 挽联 */}
          <WreathGallery
            wreaths={summary.recentWreaths}
            total={summary.wreath}
          />

          {/* 祭坛: candles flanking the censer */}
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
      ) : (
        <p className="altarEmpty">{t("noOfferingsYet")}</p>
      )}

      {/* Action buttons */}
      <div className="altarActions">
        <button
          type="button"
          className="altarActionBtn"
          onClick={() => {
            /* TODO: offering purchase flow */
          }}
        >
          <IncenseIcon />
          <span className="altarActionLabel">{t("offerIncense")}</span>
          <span className="altarActionPrice">{t("free")}</span>
        </button>

        <button
          type="button"
          className="altarActionBtn"
          onClick={() => {
            /* TODO: offering purchase flow */
          }}
        >
          <CandleIcon />
          <span className="altarActionLabel">{t("offerCandle")}</span>
          <span className="altarActionPrice">¥9.9</span>
        </button>

        <button
          type="button"
          className="altarActionBtn"
          onClick={() => {
            /* TODO: offering purchase flow */
          }}
        >
          <WreathIcon />
          <span className="altarActionLabel">{t("offerWreath")}</span>
          <span className="altarActionPrice">¥99</span>
        </button>
      </div>

      {/* Donation tiers */}
      <div className="altarDonationTiers">
        <h3 className="altarDonationTitle">{t("donateTitle")}</h3>
        <div className="altarDonationGrid">
          {DONATION_TIERS.map((tier) => (
            <button
              key={tier.amount}
              type="button"
              className="altarDonationBtn"
              onClick={() => {
                /* TODO: donation purchase flow */
              }}
            >
              <span className="altarDonationAmount">¥{tier.amount}</span>
              <span className="altarDonationDesc">{t(tier.key)}</span>
            </button>
          ))}
        </div>
        <p className="altarFeeNote">{t("feeExplanation")}</p>
      </div>
    </section>
  );
}

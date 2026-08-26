"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OfferingSummary } from "@/modules/offerings/display";

/* ────────────── SVG icons ────────────── */

/** 青铜双耳三足龙纹香炉，正面「福」字，炉内插满点燃的线香。 */
function IncenseIcon() {
  const sticks = [30, 36, 40, 44, 50];
  return (
    <svg
      className="altarItemSvg"
      viewBox="0 0 80 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="brassSmall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e0c079" />
          <stop offset="0.45" stopColor="#b5912f" />
          <stop offset="1" stopColor="#795c20" />
        </linearGradient>
      </defs>

      {/* drop shadow */}
      <ellipse cx="40" cy="110" rx="30" ry="4" fill="#6b5424" opacity="0.14" />

      {/* three lion-paw feet */}
      {[
        { x: 27, front: false },
        { x: 53, front: false },
        { x: 40, front: true },
      ].map((f) => {
        const py = f.front ? 112 : 109;
        return (
          <g key={`sfoot-${f.x}`}>
            <path
              d={`M${f.x - 4} 100 L${f.x - 3} ${py - 2} Q${f.x} ${py} ${f.x + 3} ${py - 2} L${f.x + 4} 100 Z`}
              fill="#9a7a2c"
            />
            <ellipse cx={f.x} cy={py} rx="5.4" ry="3" fill="#8a6a24" />
            <ellipse cx={f.x - 3} cy={py} rx="1.6" ry="2.2" fill="#7c5f22" />
            <ellipse cx={f.x} cy={py + 0.5} rx="1.7" ry="2.4" fill="#7c5f22" />
            <ellipse cx={f.x + 3} cy={py} rx="1.6" ry="2.2" fill="#7c5f22" />
          </g>
        );
      })}

      {/* pot belly */}
      <path
        d="M18 80 Q15 104 32 106 L48 106 Q65 104 62 80 Z"
        fill="url(#brassSmall)"
      />
      {/* dragon-relief hint */}
      <path d="M22 88 q9 5 18 0 q9 -5 18 0" stroke="#6f5420" strokeWidth="1" opacity="0.3" fill="none" />

      {/* 福 medallion */}
      <circle cx="40" cy="92" r="8.5" fill="#8a6a24" opacity="0.35" />
      <circle cx="40" cy="92" r="8.5" fill="none" stroke="#ecd79a" strokeWidth="1.1" />
      <text
        x="40"
        y="95.6"
        textAnchor="middle"
        fontSize="10"
        fontWeight="700"
        fill="#f4e6ab"
        style={{ fontFamily: '"Songti SC","Noto Serif SC","SimSun",serif' }}
      >
        福
      </text>

      {/* ear-scroll handles */}
      <path d="M18 79 q-9 -1 -9 8 q0 6 7 6" stroke="#b5912f" strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <path d="M62 79 q9 -1 9 8 q0 6 -7 6" stroke="#b5912f" strokeWidth="3.4" fill="none" strokeLinecap="round" />

      {/* metallic rim + 回纹 band */}
      <ellipse cx="40" cy="79" rx="25" ry="6.4" fill="#caa74f" />
      <ellipse cx="40" cy="79" rx="25" ry="6.4" fill="none" stroke="#6f5420" strokeWidth="1" strokeDasharray="2 2.4" opacity="0.5" />

      {/* incense sticks (bottoms hidden by ash below) */}
      {sticks.map((x, i) => (
        <line
          key={i}
          x1={x}
          y1={79}
          x2={x}
          y2={24 + (i % 3) * 5}
          stroke="#a9702f"
          strokeWidth="1.6"
        />
      ))}

      {/* ash bed hides stick bottoms */}
      <ellipse cx="40" cy="77" rx="19" ry="3.4" fill="#ddd2b6" />
      <ellipse cx="40" cy="76.4" rx="19" ry="1.4" fill="#f0e9d4" opacity="0.7" />

      {/* glowing embers */}
      {sticks.map((x, i) => (
        <circle key={`e${i}`} cx={x} cy={24 + (i % 3) * 5} r="2.2" fill="#ef7d2a">
          <animate attributeName="r" values="1.6;2.6;1.6" dur={`${1.8 + i * 0.2}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.7;1;0.7" dur={`${1.8 + i * 0.2}s`} repeatCount="indefinite" />
        </circle>
      ))}

      {/* rising smoke */}
      {[30, 40, 50].map((x, i) => (
        <path
          key={`s${i}`}
          d={`M${x} ${22 - (i % 3) * 2} q -5 -9 0 -18 q 5 -9 0 -16`}
          stroke="#b8b3a8"
          strokeWidth="1.3"
          strokeLinecap="round"
          fill="none"
          opacity="0.3"
        >
          <animate attributeName="opacity" values="0.3;0.08;0.3" dur={`${2.6 + i * 0.4}s`} repeatCount="indefinite" />
        </path>
      ))}
    </svg>
  );
}

/** 红柱蜡烛 — 金色「平安吉祥」竖排字，铜莲花座，顶端火焰。 */
function CandleIcon() {
  return (
    <svg
      className="altarItemSvg"
      viewBox="0 0 56 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="candleRed" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8a1a14" />
          <stop offset="0.16" stopColor="#c62f26" />
          <stop offset="0.5" stopColor="#e55044" />
          <stop offset="0.64" stopColor="#c62f26" />
          <stop offset="1" stopColor="#7c150f" />
        </linearGradient>
        <linearGradient id="candleGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#efd484" />
          <stop offset="1" stopColor="#a97f2c" />
        </linearGradient>
      </defs>

      {/* flame halo */}
      <circle cx="28" cy="23" r="12" fill="#fcd34d" opacity="0.14">
        <animate attributeName="r" values="12;15;12" dur="2.4s" repeatCount="indefinite" />
      </circle>
      {/* flame */}
      <ellipse cx="28" cy="22" rx="4.3" ry="10" fill="#f59e0b" opacity="0.92">
        <animate attributeName="ry" values="10;11.6;9.3;10" dur="0.9s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="28" cy="23.5" rx="2.1" ry="5.3" fill="#fef3c7" />
      <line x1="28" y1="34" x2="28" y2="29" stroke="#4a3f33" strokeWidth="1.2" />

      {/* recessed wax pool at the top */}
      <ellipse cx="28" cy="36" rx="12" ry="3.6" fill="#7c150f" />
      <ellipse cx="28" cy="35" rx="12" ry="3.2" fill="#b8261d" />
      <ellipse cx="28" cy="35" rx="8.5" ry="2" fill="#5c110c" />

      {/* pillar body */}
      <rect x="16" y="35" width="24" height="66" rx="2.5" fill="url(#candleRed)" />
      <rect x="18.5" y="47" width="3.5" height="42" rx="1.75" fill="#ffffff" opacity="0.18" />

      {/* gold bands (回纹) top & bottom */}
      <g>
        <rect x="16" y="41" width="24" height="6" fill="url(#candleGold)" />
        <rect x="16" y="42" width="24" height="0.8" fill="#7c5f22" opacity="0.55" />
        <rect x="16" y="45.2" width="24" height="0.8" fill="#7c5f22" opacity="0.55" />
        <rect x="16" y="89" width="24" height="6" fill="url(#candleGold)" />
        <rect x="16" y="90" width="24" height="0.8" fill="#7c5f22" opacity="0.55" />
        <rect x="16" y="93.2" width="24" height="0.8" fill="#7c5f22" opacity="0.55" />
      </g>

      {/* vertical gold text 平安吉祥 */}
      <g
        fill="#f2d97e"
        textAnchor="middle"
        fontWeight="700"
        fontSize="8.6"
        style={{ fontFamily: '"Songti SC","Noto Serif SC","SimSun",serif' }}
      >
        <text x="28" y="58">平</text>
        <text x="28" y="68.5">安</text>
        <text x="28" y="79">吉</text>
        <text x="28" y="89.5">祥</text>
      </g>

      {/* bronze lotus base */}
      <ellipse cx="28" cy="112" rx="19" ry="4" fill="#6b5424" opacity="0.14" />
      <g fill="url(#candleGold)" stroke="#7c5f22" strokeWidth="0.5">
        <path d="M28 108 C20 108 15 103 14 97 C21 99 26 102 28 108 Z" />
        <path d="M28 108 C36 108 41 103 42 97 C35 99 30 102 28 108 Z" />
        <path d="M28 109 C23 108 19 104 18 99 C24 100 27 103 28 109 Z" />
        <path d="M28 109 C33 108 37 104 38 99 C32 100 29 103 28 109 Z" />
        <path d="M28 110 C26 106 25 101 28 97 C31 101 30 106 28 110 Z" />
      </g>
      {/* pedestal foot */}
      <rect x="20" y="108" width="16" height="5" rx="2" fill="url(#candleGold)" />
      <ellipse cx="28" cy="114" rx="12" ry="3" fill="#a97f2c" />
      <ellipse cx="28" cy="113.4" rx="12" ry="1.2" fill="#e6cf8f" opacity="0.7" />
    </svg>
  );
}

/** 白菊花圈 — 顶部黑蝴蝶结，中间白色挽联，黑色三脚架。 */
function WreathIcon() {
  const cx = 60;
  const cy = 62;
  const radius = 40;
  const clusters = Array.from({ length: 18 }, (_, i) => {
    const angle = (i / 18) * Math.PI * 2 - Math.PI / 2;
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
      {/* black tripod easel (behind) */}
      <line x1="60" y1="66" x2="30" y2="152" stroke="#1e1e1e" strokeWidth="3" strokeLinecap="round" />
      <line x1="60" y1="66" x2="90" y2="152" stroke="#1e1e1e" strokeWidth="3" strokeLinecap="round" />
      <line x1="62" y1="70" x2="66" y2="150" stroke="#3a3a3a" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="36" y1="128" x2="84" y2="128" stroke="#1e1e1e" strokeWidth="2" />

      {/* green foliage ring */}
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#3f7a3f" strokeWidth="15" opacity="0.55" />
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#63a463" strokeWidth="8" opacity="0.4" />

      {/* white chrysanthemum clusters */}
      {clusters.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y} r="6.2" fill={c.pale ? "#ffffff" : "#f7f4ea"} />
          <circle cx={c.x} cy={c.y} r="5.2" fill="none" stroke="#e7e2d2" strokeWidth="0.8" />
          <circle cx={c.x} cy={c.y} r="1.7" fill="#eadfa8" />
        </g>
      ))}

      {/* white ribbons (挽联) hanging down the centre */}
      <path d="M53 30 h6 v112 l-3 -6 l-3 6 Z" fill="#f7f4ec" stroke="#d9cfb4" strokeWidth="0.5" />
      <path d="M61 30 h6 v112 l-3 -6 l-3 6 Z" fill="#f2ede1" stroke="#d9cfb4" strokeWidth="0.5" />

      {/* black satin bow at the top */}
      {/* flowing swallowtail tails */}
      <path d="M58 33 C55 44 52 52 47 61 L52 57.5 L54 63 C57 53 59 44 60 34 Z" fill="#151515" />
      <path d="M62 33 C65 44 68 52 73 61 L68 57.5 L66 63 C63 53 61 44 60 34 Z" fill="#151515" />
      {/* soft looped ears */}
      <path d="M60 31 C50 21 37 23 40 34 C41 42 54 39 60 33 Z" fill="#1d1d1d" />
      <path d="M60 31 C70 21 83 23 80 34 C79 42 66 39 60 33 Z" fill="#1d1d1d" />
      {/* satin sheen on the loops */}
      <path d="M58 31 C51 26 44 26 42 31" stroke="#4c4c4c" strokeWidth="1.1" fill="none" opacity="0.55" strokeLinecap="round" />
      <path d="M62 31 C69 26 76 26 78 31" stroke="#4c4c4c" strokeWidth="1.1" fill="none" opacity="0.55" strokeLinecap="round" />
      {/* centre knot */}
      <rect x="56.4" y="28" width="7.2" height="9" rx="3.2" fill="#0c0c0c" />
      <line x1="60" y1="29.5" x2="60" y2="35.5" stroke="#3a3a3a" strokeWidth="0.8" opacity="0.7" />
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
  const left = 74;
  const right = 166;
  const range = right - left;

  if (visible <= 3) {
    const gap = 22;
    const start = 120 - ((visible - 1) * gap) / 2;
    for (let i = 0; i < visible; i++) {
      sticks.push({
        x: start + i * gap,
        h: 58 + (i % 3) * 7,
        delay: `${i * 0.5}s`,
      });
    }
  } else {
    for (let i = 0; i < visible; i++) {
      const t = (i + 0.5) / visible;
      sticks.push({
        x: left + t * range,
        h: 52 + ((i * 7 + 3) % 16),
        delay: `${((i * 0.3) % 3).toFixed(1)}s`,
      });
    }
  }

  return (
    <svg
      className="altarCenserSvg"
      viewBox="0 0 240 178"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <filter id="censerSmoke" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.7" />
        </filter>
        <linearGradient id="brassBig" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e2c37c" />
          <stop offset="0.45" stopColor="#b5912f" />
          <stop offset="1" stopColor="#775a1f" />
        </linearGradient>
      </defs>

      {/* ground shadow */}
      <ellipse cx="120" cy="170" rx="78" ry="6" fill="#6b5424" opacity="0.12" />

      {/* three lion-paw feet */}
      {[
        { x: 80, front: false },
        { x: 160, front: false },
        { x: 120, front: true },
      ].map((f) => {
        const py = f.front ? 173 : 169;
        return (
          <g key={`foot-${f.x}`}>
            <path
              d={`M${f.x - 8} 146 L${f.x - 6} ${py - 4} Q${f.x} ${py - 1} ${f.x + 6} ${py - 4} L${f.x + 8} 146 Z`}
              fill="#9a7a2c"
            />
            <ellipse cx={f.x} cy={py} rx="11" ry="6.5" fill="#8a6a24" />
            <ellipse cx={f.x - 6} cy={py} rx="3.2" ry="4.4" fill="#7c5f22" />
            <ellipse cx={f.x} cy={py + 1} rx="3.4" ry="4.8" fill="#7c5f22" />
            <ellipse cx={f.x + 6} cy={py} rx="3.2" ry="4.4" fill="#7c5f22" />
          </g>
        );
      })}

      {/* pot belly */}
      <path d="M56 96 Q52 150 92 152 L148 152 Q188 150 184 96 Z" fill="url(#brassBig)" />
      {/* dragon-relief hint */}
      <path d="M66 116 q27 12 54 0 q27 -12 54 0" stroke="#6f5420" strokeWidth="1.6" opacity="0.28" fill="none" />
      <path d="M70 128 q25 9 50 0 q25 -9 50 0" stroke="#6f5420" strokeWidth="1.2" opacity="0.2" fill="none" />

      {/* 福 medallion */}
      <circle cx="120" cy="120" r="19" fill="#8a6a24" opacity="0.32" />
      <circle cx="120" cy="120" r="19" fill="none" stroke="#ecd79a" strokeWidth="2" />
      <text
        x="120"
        y="128"
        textAnchor="middle"
        fontSize="24"
        fontWeight="700"
        fill="#f4e6ab"
        style={{ fontFamily: '"Songti SC","Noto Serif SC","SimSun",serif' }}
      >
        福
      </text>

      {/* ear-scroll handles */}
      <path d="M56 92 q-20 -2 -20 16 q0 13 15 13" stroke="url(#brassBig)" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M184 92 q20 -2 20 16 q0 13 -15 13" stroke="url(#brassBig)" strokeWidth="8" fill="none" strokeLinecap="round" />

      {/* metallic rim + 回纹 band */}
      <ellipse cx="120" cy="92" rx="70" ry="11" fill="#caa74f" />
      <ellipse cx="120" cy="90" rx="66" ry="9" fill="#b89840" />
      <ellipse cx="120" cy="92" rx="70" ry="11" fill="none" stroke="#6f5420" strokeWidth="1.4" strokeDasharray="4 4" opacity="0.5" />

      {sticks.map((s, i) => (
        <line key={i} x1={s.x} y1={90} x2={s.x} y2={90 - s.h} stroke="#a9702f" strokeWidth="1.8" />
      ))}

      {/* ash bed hides stick bottoms */}
      <ellipse cx="120" cy="88" rx="56" ry="6" fill="#d9cfb4" />
      <ellipse cx="120" cy="86.5" rx="56" ry="2.4" fill="#f0e9d4" opacity="0.7" />

      {sticks.map((s, i) => (
        <circle key={`e${i}`} cx={s.x} cy={90 - s.h} r="2.4" fill="#ef7d2a">
          <animate attributeName="r" values="1.6;2.8;1.6" dur="2s" begin={s.delay} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" begin={s.delay} repeatCount="indefinite" />
        </circle>
      ))}
      {/* Smoke rising gently from the censer — soft, blurred wisps that drift
          upward, sway a little and fade near the top. */}
      {[
        { x: 102, base: 82, begin: "0s", dur: "6.5s" },
        { x: 121, base: 78, begin: "2.1s", dur: "7.4s" },
        { x: 140, base: 83, begin: "4.3s", dur: "6.8s" },
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

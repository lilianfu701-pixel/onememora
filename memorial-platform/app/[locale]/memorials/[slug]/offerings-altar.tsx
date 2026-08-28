"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OfferingSummary } from "@/modules/offerings/display";

/* ────────────── Prop photos ────────────── */

/*
 * The three altar props are artwork (glowing dark-ground renders), shown as
 * rounded plaques so their dark backgrounds read as intentional. The context
 * (action button, censer stand, gallery card, modal) sizes each one in CSS.
 */
function IncensePhoto({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={`altarPhoto altarPhotoIncense${className ? ` ${className}` : ""}`}
      src="/images/offerings/incense.webp"
      alt=""
      loading="lazy"
    />
  );
}

function CandlePhoto({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={`altarPhoto altarPhotoCandle${className ? ` ${className}` : ""}`}
      src="/images/offerings/candle.webp"
      alt=""
      loading="lazy"
    />
  );
}

function WreathPhoto({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={`altarPhoto altarPhotoWreath${className ? ` ${className}` : ""}`}
      src="/images/offerings/wreath.webp"
      alt=""
      loading="lazy"
    />
  );
}

/**
 * A small bound bundle of lit incense sticks — the icon for the 上香 action,
 * so the button shows the incense itself rather than the censer.
 */
function IncenseBundle() {
  const n = 4;
  const centre = (n - 1) / 2;
  const sticks = Array.from({ length: n }, (_, i) => {
    const off = i - centre;
    const baseX = 26 + off * 1.6;
    const tipX = 26 + off * 7.4;
    const tipY = 13 + ((i * 5) % 9);
    return {
      baseX,
      tipX,
      tipY,
      ember: `${(i * 0.4).toFixed(1)}s`,
      smoke: `${(i * 0.7).toFixed(1)}s`,
    };
  });
  return (
    <svg
      className="altarBundle"
      viewBox="0 0 52 92"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <filter id="bundleSmoke" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="0.8" />
        </filter>
      </defs>
      {sticks.map((s, i) => {
        const redX = s.baseX + (s.tipX - s.baseX) * 0.28;
        const redY = 82 + (s.tipY - 82) * 0.28;
        return (
          <g key={i}>
            <line x1={s.baseX} y1={82} x2={s.tipX} y2={s.tipY} stroke="#c69a5c" strokeWidth="2" strokeLinecap="round" />
            <line x1={s.baseX} y1={82} x2={redX} y2={redY} stroke="#8f2016" strokeWidth="2.2" strokeLinecap="round" />
            <g transform={`translate(${s.tipX} ${s.tipY})`}>
              <path
                d="M0 0 q -4 -8 0 -16 q 4 -8 0 -14"
                stroke="#d2ccc0"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                filter="url(#bundleSmoke)"
                opacity="0"
              >
                <animate attributeName="opacity" values="0;0.4;0.28;0" keyTimes="0;0.3;0.72;1" dur="5s" begin={s.smoke} repeatCount="indefinite" />
                <animateTransform attributeName="transform" type="translate" values="0 0; -3 -14; 3 -30" keyTimes="0;0.5;1" dur="5s" begin={s.smoke} repeatCount="indefinite" />
              </path>
            </g>
            <circle cx={s.tipX} cy={s.tipY} r="2.3" fill="#ff7a2a">
              <animate attributeName="r" values="1.6;2.9;1.6" dur="1.8s" begin={s.ember} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.75;1;0.75" dur="1.8s" begin={s.ember} repeatCount="indefinite" />
            </circle>
          </g>
        );
      })}
      {/* red binding paper near the base */}
      <rect x="17" y="77" width="18" height="8" rx="2.5" fill="#b23a2a" />
      <rect x="17" y="80" width="18" height="1.6" fill="#e6cf8f" opacity="0.85" />
    </svg>
  );
}

/**
 * Lit incense sticks planted in the censer's sand — one per offering. Rendered
 * over the censer photo (which ships with an empty sand bed), bases clustered
 * at the centre and tips fanning out, each with a glowing ember.
 */
function IncenseSticks({ count }: { count: number }) {
  const MAX = 12;
  const n = Math.min(count, MAX);
  const centre = (n - 1) / 2;
  const sticks = Array.from({ length: n }, (_, i) => {
    const off = i - centre;
    const baseX = 60 + off * 3.6; // bases a little more spread
    const tipX = 60 + off * 8.8; // tips fan wider
    const len = 108 + ((i * 13) % 22); // taller, so they clear the rim
    const tipY = 100 - len;
    return {
      baseX,
      tipX,
      tipY,
      ember: `${((i * 0.37) % 2.4).toFixed(2)}s`,
      smoke: `${((i * 0.73) % 3.2).toFixed(2)}s`,
    };
  });
  return (
    <svg
      className="censerSticks"
      viewBox="0 0 120 100"
      preserveAspectRatio="xMidYMax meet"
      aria-hidden="true"
    >
      <defs>
        <filter id="incenseSmoke" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="0.9" />
        </filter>
      </defs>
      {sticks.map((s, i) => {
        const redX = s.baseX + (s.tipX - s.baseX) * 0.3;
        const redY = 100 + (s.tipY - 100) * 0.3;
        return (
          <g key={i}>
            <line x1={s.baseX} y1={100} x2={s.tipX} y2={s.tipY} stroke="#c69a5c" strokeWidth="1.5" strokeLinecap="round" />
            <line x1={s.baseX} y1={100} x2={redX} y2={redY} stroke="#8f2016" strokeWidth="1.8" strokeLinecap="round" />
            {/* rising 青烟 */}
            <g transform={`translate(${s.tipX} ${s.tipY})`}>
              <path
                d="M0 0 q -5 -10 0 -20 q 5 -10 0 -18"
                stroke="#d2ccc0"
                strokeWidth="1.3"
                fill="none"
                strokeLinecap="round"
                filter="url(#incenseSmoke)"
                opacity="0"
              >
                <animate attributeName="opacity" values="0;0.36;0.26;0" keyTimes="0;0.28;0.72;1" dur="5.2s" begin={s.smoke} repeatCount="indefinite" />
                <animateTransform attributeName="transform" type="translate" values="0 0; -3 -16; 3 -34" keyTimes="0;0.5;1" dur="5.2s" begin={s.smoke} repeatCount="indefinite" />
              </path>
            </g>
            <circle cx={s.tipX} cy={s.tipY} r="2" fill="#ff7a2a">
              <animate attributeName="r" values="1.4;2.5;1.4" dur="1.8s" begin={s.ember} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.72;1;0.72" dur="1.8s" begin={s.ember} repeatCount="indefinite" />
            </circle>
          </g>
        );
      })}
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

/* ────────────── Display: 蜡烛组 ────────────── */

function CandleGroup(props: {
  candles: { name: string | null; createdAt: Date }[];
}) {
  if (props.candles.length === 0) return null;
  return (
    <div className="altarCandleSide">
      {props.candles.map((c, i) => (
        <div key={i} className="altarCandleUnit">
          <CandlePhoto />
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
          <WreathPhoto />
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
  /** The signed-in visitor's own profile name, prefilled when they offer. */
  viewerName?: string | null;
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
    // Prefill with the visitor's own name so lighting a candle (or any
    // offering) shows who it is from; they can edit, clear, or mask it.
    setName(props.viewerName ?? "");
    setMasked(false);
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

      <MeritBook
        donors={summary.recentDonations}
        total={summary.donation}
        totalAmount={summary.donationTotal}
        t={t}
      />

      <WreathGallery wreaths={summary.recentWreaths} total={summary.wreath} />

      {/* The censer stands on the altar at all times; candles flank it once lit. */}
      <div className="altarPlatform">
        <CandleGroup candles={leftCandles} />
        <div className="altarCenserWrap">
          <div className="altarCenser">
            <IncensePhoto className="altarCenserPhoto" />
            {summary.incense > 0 ? (
              <IncenseSticks count={summary.incense} />
            ) : null}
          </div>
          {summary.incense > 0 ? (
            <span className="altarCenserCount">
              {t("incenseCount", { count: summary.incense })}
            </span>
          ) : null}
        </div>
        <CandleGroup candles={rightCandles} />
      </div>

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
          <IncenseBundle />
          <span className="altarActionLabel">{t("offerIncense")}</span>
          <span className="altarActionDesc">{t("descIncense")}</span>
        </button>

        <button
          type="button"
          className="altarActionBtn"
          onClick={() => openModal("candle")}
        >
          <CandlePhoto />
          <span className="altarActionLabel">{t("offerCandle")}</span>
          <span className="altarActionDesc">{t("descCandle")}</span>
        </button>

        <button
          type="button"
          className="altarActionBtn"
          onClick={() => openModal("wreath")}
        >
          <WreathPhoto />
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
              {modal === "candle" ? <CandlePhoto /> : null}
              {modal === "wreath" ? <WreathPhoto /> : null}
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

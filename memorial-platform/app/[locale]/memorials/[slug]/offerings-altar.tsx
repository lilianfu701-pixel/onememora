"use client";

import { useTranslations } from "next-intl";
import type { OfferingSummary } from "@/modules/offerings/display";

function maskName(name: string): string {
  if (name.length <= 1) return name;
  if (name.length === 2) return name[0] + "*";
  return name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
}

function IncenseCluster(props: { count: number }) {
  const sticks = Math.min(props.count, 9);
  if (sticks === 0) return null;

  return (
    <div className="altarIncenseCluster" aria-hidden="true">
      {Array.from({ length: sticks }, (_, i) => (
        <div
          key={i}
          className="altarIncenseStick"
          style={{
            "--stick-delay": `${i * 0.3}s`,
            "--stick-offset": `${(i - Math.floor(sticks / 2)) * 6}px`,
          } as React.CSSProperties}
        >
          <div className="altarIncenseSmoke" />
          <div className="altarIncenseTip" />
          <div className="altarIncenseBody" />
        </div>
      ))}
    </div>
  );
}

function CandleRow(props: {
  candles: { name: string | null; createdAt: Date }[];
  total: number;
}) {
  if (props.total === 0) return null;

  const displayed = props.candles.slice(0, 8);
  const remaining = props.total - displayed.length;

  return (
    <div className="altarCandleRow">
      {displayed.map((c, i) => (
        <div
          key={i}
          className="altarCandle"
          style={{ "--candle-delay": `${i * 0.15}s` } as React.CSSProperties}
        >
          <div className="altarCandleFlame" />
          <div className="altarCandleBody" />
          {c.name ? (
            <span className="altarCandleName">{maskName(c.name)}</span>
          ) : null}
        </div>
      ))}
      {remaining > 0 ? (
        <span className="altarCandleMore">+{remaining}</span>
      ) : null}
    </div>
  );
}

function WreathCards(props: {
  wreaths: { name: string | null; message: string | null; createdAt: Date }[];
  total: number;
}) {
  if (props.total === 0) return null;

  return (
    <div className="altarWreathGrid">
      {props.wreaths.slice(0, 4).map((w, i) => (
        <div key={i} className="altarWreathCard">
          <div className="altarWreathIcon" aria-hidden="true" />
          {w.message ? (
            <p className="altarWreathEulogy">{w.message}</p>
          ) : null}
          {w.name ? (
            <span className="altarWreathGiver">{w.name}</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function DonorWall(props: {
  donors: { name: string | null; amountMinor: number; createdAt: Date }[];
  total: number;
  totalAmount: number;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
}) {
  if (props.total === 0) return null;

  const tiers = [
    { min: 99900, label: "gold", cls: "altarDonorGold" },
    { min: 49900, label: "silver", cls: "altarDonorSilver" },
    { min: 0, label: "bronze", cls: "altarDonorBronze" },
  ] as const;

  return (
    <div className="altarDonorWall">
      <div className="altarDonorHeader">
        <span className="altarDonorTitle">{props.t("donorWallTitle")}</span>
        <span className="altarDonorTotal">
          {props.t("donorWallTotal", {
            amount: (props.totalAmount / 100).toFixed(0),
          })}
        </span>
      </div>
      <div className="altarDonorList">
        {props.donors.map((d, i) => {
          const tier = tiers.find((t) => d.amountMinor >= t.min) ?? tiers[2];
          return (
            <span key={i} className={`altarDonorChip ${tier.cls}`}>
              {d.name ?? props.t("anonymousDonor")}
            </span>
          );
        })}
      </div>
    </div>
  );
}

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

  return (
    <section className="altarSection" aria-label={t("altarHeading")}>
      <h2 className="altarHeading">{t("altarHeading")}</h2>

      {hasAnything ? (
        <div className="altarStage">
          <div className="altarCenser">
            <IncenseCluster count={summary.incense} />
            {summary.incense > 0 ? (
              <span className="altarIncenseCount">
                {t("incenseCount", { count: summary.incense })}
              </span>
            ) : null}
          </div>

          <CandleRow candles={summary.recentCandles} total={summary.candle} />

          <WreathCards
            wreaths={summary.recentWreaths}
            total={summary.wreath}
          />

          <DonorWall
            donors={summary.recentDonations}
            total={summary.donation}
            totalAmount={summary.donationTotal}
            t={t}
          />
        </div>
      ) : (
        <p className="altarEmpty">{t("noOfferingsYet")}</p>
      )}

      <div className="altarActions">
        <button
          type="button"
          className="altarActionBtn altarActionIncense"
          onClick={() => {
            /* TODO: offering purchase flow */
          }}
        >
          <span className="altarActionIcon" aria-hidden="true">
            🪔
          </span>
          <span className="altarActionLabel">{t("offerIncense")}</span>
          <span className="altarActionPrice">{t("free")}</span>
        </button>

        <button
          type="button"
          className="altarActionBtn altarActionCandle"
          onClick={() => {
            /* TODO: offering purchase flow */
          }}
        >
          <span className="altarActionIcon" aria-hidden="true">
            🕯️
          </span>
          <span className="altarActionLabel">{t("offerCandle")}</span>
          <span className="altarActionPrice">¥9.9</span>
        </button>

        <button
          type="button"
          className="altarActionBtn altarActionWreath"
          onClick={() => {
            /* TODO: offering purchase flow */
          }}
        >
          <span className="altarActionIcon" aria-hidden="true">
            🎋
          </span>
          <span className="altarActionLabel">{t("offerWreath")}</span>
          <span className="altarActionPrice">¥99</span>
        </button>

        <button
          type="button"
          className="altarActionBtn altarActionDonate"
          onClick={() => {
            /* TODO: offering purchase flow */
          }}
        >
          <span className="altarActionIcon" aria-hidden="true">
            🤲
          </span>
          <span className="altarActionLabel">{t("donate")}</span>
          <span className="altarActionPrice">¥199+</span>
        </button>
      </div>

      <p className="altarFeeNote">{t("feeExplanation")}</p>
    </section>
  );
}

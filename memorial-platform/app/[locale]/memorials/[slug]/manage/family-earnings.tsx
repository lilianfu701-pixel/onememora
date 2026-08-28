import { getTranslations } from "next-intl/server";
import type { FamilyAccrual } from "@/modules/offerings/accrual";

/**
 * Family gift-out bookkeeping.
 *
 * Read-only summary on the manage page: total paid in, the 20% platform service
 * fee, and the net the platform will gift to the family. Framed as an accrual to
 * be gifted — not a custodial balance — and the ¥1000 threshold to request it.
 * Requesting and paying out are a later phase.
 */
export async function FamilyEarnings(props: {
  locale: string;
  accrual: FamilyAccrual;
}) {
  const t = await getTranslations({
    locale: props.locale,
    namespace: "offerings",
  });
  const money = (minor: number) => `¥${(minor / 100).toFixed(2)}`;
  const { accrual } = props;
  const remaining = Math.max(0, accrual.thresholdMinor - accrual.grossMinor);
  const pct = Math.min(
    100,
    Math.round((accrual.grossMinor / accrual.thresholdMinor) * 100),
  );

  return (
    <section className="stack earningsPanel">
      <h2>{t("earningsTitle")}</h2>

      <div className="earningsFigures">
        <div className="earningsFigure">
          <span className="earningsLabel">{t("earningsGross")}</span>
          <span className="earningsValue">{money(accrual.grossMinor)}</span>
        </div>
        <div className="earningsFigure">
          <span className="earningsLabel">{t("earningsFee")}</span>
          <span className="earningsValue earningsFeeValue">
            −{money(accrual.feeMinor)}
          </span>
        </div>
        <div className="earningsFigure earningsFigureNet">
          <span className="earningsLabel">{t("earningsNet")}</span>
          <span className="earningsValue">{money(accrual.netMinor)}</span>
        </div>
      </div>

      <div className="earningsThreshold">
        <div
          className="earningsBar"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span className="earningsBarFill" style={{ width: `${pct}%` }} />
        </div>
        <p className="muted earningsThresholdNote">
          {accrual.reached
            ? t("earningsThresholdReached")
            : t("earningsThresholdProgress", { amount: money(remaining) })}
        </p>
      </div>

      <p className="muted earningsNote">{t("earningsNote")}</p>
    </section>
  );
}

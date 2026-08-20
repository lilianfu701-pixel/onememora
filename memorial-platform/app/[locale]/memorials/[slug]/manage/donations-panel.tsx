import { getTranslations } from "next-intl/server";
import type { DonationLedger } from "@/modules/offerings/donations";

/**
 * The family's donation ledger.
 *
 * Server-rendered read-only view on the manage page: every gift in arrival
 * order, with the giver's chosen name and message. Payout mechanics are a
 * later phase — this is the record the family can read and reconcile against.
 */
export async function DonationsPanel(props: {
  locale: string;
  ledger: DonationLedger;
}) {
  const t = await getTranslations({
    locale: props.locale,
    namespace: "offerings",
  });

  const money = (minor: number) => `¥${(minor / 100).toFixed(2)}`;
  const date = (d: Date) =>
    new Intl.DateTimeFormat(props.locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(d);

  return (
    <section className="stack donationsPanel">
      <div className="donationsPanelHead">
        <h2>{t("familyDonationsTitle")}</h2>
        {props.ledger.count > 0 ? (
          <span className="muted">
            {t("familyDonationsTotal", {
              count: props.ledger.count,
              amount: (props.ledger.grossMinor / 100).toFixed(2),
            })}
          </span>
        ) : null}
      </div>

      {props.ledger.count === 0 ? (
        <p className="muted">{t("familyDonationsEmpty")}</p>
      ) : (
        <div className="donationsTableWrap">
          <table className="adminTable donationsTable">
            <thead>
              <tr>
                <th>{t("colDonor")}</th>
                <th>{t("colAmount")}</th>
                <th>{t("colMessage")}</th>
                <th>{t("colDate")}</th>
              </tr>
            </thead>
            <tbody>
              {props.ledger.records.map((r) => (
                <tr key={r.id}>
                  <td>{r.name ?? t("anonymousDonor")}</td>
                  <td className="donationsAmount">{money(r.amountMinor)}</td>
                  <td>{r.message ?? "—"}</td>
                  <td className="donationsDate">{date(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

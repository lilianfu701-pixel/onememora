import { and, desc, eq, isNull } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { db } from "@/db/client";
import { memorialMembers, memorialNames, memorials } from "@/db/schema";
import { familyAccrual } from "@/modules/offerings/accrual";
import { listDonations } from "@/modules/offerings/donations";
import {
  getBeneficiary,
  listOwnerPayouts,
  payoutStanding,
} from "@/modules/offerings/payouts";
import { FamilyEarnings } from "../memorials/[slug]/manage/family-earnings";
import { DonationsPanel } from "../memorials/[slug]/manage/donations-panel";
import { FamilyPayout } from "../memorials/[slug]/manage/family-payout";

/**
 * The owner's finances, gathered from every memorial they own — the offerings
 * income, the donation ledger and the gift-out (payout) panel. Moved here from
 * each memorial's manage page so a family sees all their accounts in one place.
 * Grouped by memorial; a memorial with no income and no payout account is
 * omitted to keep the section quiet until money actually arrives.
 */
export async function AccountFinance(props: {
  userId: string;
  locale: string;
}) {
  const t = await getTranslations({
    locale: props.locale,
    namespace: "account",
  });

  const owned = await db()
    .select({
      id: memorials.id,
      name: memorialNames.value,
    })
    .from(memorialMembers)
    .innerJoin(memorials, eq(memorials.id, memorialMembers.memorialId))
    .leftJoin(
      memorialNames,
      and(
        eq(memorialNames.memorialId, memorials.id),
        eq(memorialNames.type, "primary"),
      ),
    )
    .where(
      and(
        eq(memorialMembers.userId, props.userId),
        eq(memorialMembers.role, "owner"),
        isNull(memorialMembers.revokedAt),
        isNull(memorials.deletionRequestedAt),
      ),
    )
    .orderBy(desc(memorials.createdAt));

  const groups = [];
  for (const m of owned) {
    const accrual = await familyAccrual(m.id);
    const beneficiary = await getBeneficiary(m.id);
    // Nothing has come in and no payout account exists — skip it.
    if (accrual.count === 0 && !beneficiary) continue;
    const donations = await listDonations(m.id);
    const standing = await payoutStanding(m.id, beneficiary?.id ?? null);
    const history = beneficiary ? await listOwnerPayouts(beneficiary.id) : [];
    groups.push({ m, accrual, beneficiary, donations, standing, history });
  }

  if (groups.length === 0) return null;

  return (
    <section className="stack-lg">
      <h2>{t("financeTitle")}</h2>
      {groups.map((g) => (
        <div className="stack" key={g.m.id}>
          <h3>{g.m.name ?? "—"}</h3>
          <div className="manageCard">
            <FamilyEarnings locale={props.locale} accrual={g.accrual} />
          </div>
          <div className="manageCard">
            <FamilyPayout
              memorialId={g.m.id}
              beneficiary={g.beneficiary}
              standing={g.standing}
              history={g.history}
            />
          </div>
          <div className="manageCard">
            <DonationsPanel locale={props.locale} ledger={g.donations} />
          </div>
        </div>
      ))}
    </section>
  );
}

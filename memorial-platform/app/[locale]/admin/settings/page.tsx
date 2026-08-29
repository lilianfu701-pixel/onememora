import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { currentActor } from "@/modules/auth/current-user";
import { getRates } from "@/modules/settings/rates";
import { RatesForm } from "./rates-form";

export const dynamic = "force-dynamic";

/** Runtime platform settings an admin can change without a redeploy. */
export default async function AdminSettingsPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  const actor = await currentActor();
  if (actor.platformRole !== "super_admin") {
    notFound();
  }

  const rates = await getRates();

  return (
    <div className="stack-lg">
      <h1>设置 · 汇率</h1>
      <p className="muted">
        PayPal 不支持人民币计价，收款按下面的「收款汇率」把人民币价格折成美元扣款；
        记账仍是人民币。「付款汇率」用于向家属转赠时折算（收款率略低于付款率，差价为平台
        汇兑收益）。改动即时生效，无需重新部署。
      </p>
      <div className="manageCard">
        <RatesForm collect={rates.collect} payout={rates.payout} />
      </div>
    </div>
  );
}

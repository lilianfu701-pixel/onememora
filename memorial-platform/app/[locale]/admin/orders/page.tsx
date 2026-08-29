import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { currentActor } from "@/modules/auth/current-user";
import { listAdminOrders } from "@/modules/offerings/orders-admin";

export const dynamic = "force-dynamic";

const yuan = (minor: number) => `¥${(minor / 100).toFixed(2)}`;

/**
 * Payment reconciliation. Every offering/donation order that went through a
 * payment provider, with the 20% fee and net split out, plus all-time paid
 * totals and a CSV export to reconcile against PayPal/Stripe.
 */
export default async function AdminOrdersPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  const actor = await currentActor();
  if (actor.platformRole !== "super_admin") {
    notFound();
  }

  const { rows, totals } = await listAdminOrders({ limit: 200 });

  return (
    <div className="stack-lg">
      <div className="adminHeadRow">
        <h1>订单 · 收款对账</h1>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- CSV download from an API route, not a page navigation */}
        <a className="button buttonQuiet buttonCompact" href="/api/admin/orders/export">
          导出 CSV
        </a>
      </div>
      <p className="muted">
        付费供奉与捐款的订单记录。金额为人民币记账口径；PayPal 实扣为按汇率折算的美元。
        合计仅统计「已支付」订单。
      </p>

      <section className="adminCardGrid">
        <div className="adminCard">
          <span className="adminCardCount">{totals.count}</span>
          <span className="adminCardLabel">已支付订单</span>
        </div>
        <div className="adminCard">
          <span className="adminCardCount">{yuan(totals.grossMinor)}</span>
          <span className="adminCardLabel">累计入账（gross）</span>
        </div>
        <div className="adminCard">
          <span className="adminCardCount">{yuan(totals.feeMinor)}</span>
          <span className="adminCardLabel">平台服务费 20%</span>
        </div>
        <div className="adminCard">
          <span className="adminCardCount">{yuan(totals.netMinor)}</span>
          <span className="adminCardLabel">应转赠家属（net）</span>
        </div>
      </section>

      {rows.length > 0 ? (
        <div className="adminTableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>时间</th>
                <th>状态</th>
                <th>渠道</th>
                <th>类型</th>
                <th>纪念页</th>
                <th>供奉人</th>
                <th>金额</th>
                <th>手续费</th>
                <th>净额</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.createdAt.toLocaleString(locale)}</td>
                  <td>
                    <span className={`adminBadge adminBadge--${r.status}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>{r.provider ?? "—"}</td>
                  <td>{(r.kind ?? "").replace("offering:", "") || "—"}</td>
                  <td>{r.memorialName ?? r.memorialSlug ?? "—"}</td>
                  <td>{r.giver ?? "—"}</td>
                  <td>{yuan(r.amountMinor)}</td>
                  <td className="muted">−{yuan(r.feeMinor)}</td>
                  <td>{yuan(r.netMinor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">还没有付费订单。</p>
      )}
    </div>
  );
}

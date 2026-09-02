import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { currentActor } from "@/modules/auth/current-user";
import {
  listAccountBalances,
  listAdminOrders,
} from "@/modules/offerings/orders-admin";

export const dynamic = "force-dynamic";

const yuan = (minor: number) => `¥${(minor / 100).toFixed(2)}`;

/** Plain-language status, so success and failure read apart at a glance. */
const STATUS_LABEL: Record<string, string> = {
  paid: "已支付",
  pending: "未完成",
  failed: "失败",
  canceled: "已取消",
  refunded: "已退款",
};
const statusText = (s: string): string => STATUS_LABEL[s] ?? s;

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

  const { rows, totals, byStatus } = await listAdminOrders({ limit: 200 });
  const accounts = await listAccountBalances();

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
        下方金额合计仅统计「已支付」订单。
      </p>

      {/* Success vs. unfinished vs. failed, split apart. */}
      <section className="adminCardGrid">
        <div className="adminCard">
          <span className="adminCardCount">{byStatus.paid.count}</span>
          <span className="adminCardLabel">
            已支付（成功）· {yuan(byStatus.paid.grossMinor)}
          </span>
        </div>
        <div className="adminCard">
          <span className="adminCardCount">{byStatus.pending.count}</span>
          <span className="adminCardLabel">
            未完成（发起未付）· {yuan(byStatus.pending.grossMinor)}
          </span>
        </div>
        <div className="adminCard">
          <span className="adminCardCount">{byStatus.failed.count}</span>
          <span className="adminCardLabel">
            失败 / 取消 · {yuan(byStatus.failed.grossMinor)}
          </span>
        </div>
      </section>

      {/* Money totals over paid orders only. */}
      <section className="adminCardGrid">
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

      {/* Which family account holds how much. */}
      <h2>各家属账户（按纪念页汇总 · 仅已支付）</h2>
      {accounts.length > 0 ? (
        <div className="adminTableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>纪念页</th>
                <th>收款家属</th>
                <th>订单数</th>
                <th>累计入账</th>
                <th>手续费</th>
                <th>应转赠净额</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.memorialSlug ?? a.memorialName ?? Math.random()}>
                  <td>{a.memorialName ?? a.memorialSlug ?? "—"}</td>
                  <td>{a.beneficiaryName ?? "未开通收款"}</td>
                  <td>{a.orderCount}</td>
                  <td>{yuan(a.grossMinor)}</td>
                  <td className="muted">−{yuan(a.feeMinor)}</td>
                  <td>{yuan(a.netMinor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">还没有已支付的入账。</p>
      )}

      <h2>订单明细</h2>

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
                      {statusText(r.status)}
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

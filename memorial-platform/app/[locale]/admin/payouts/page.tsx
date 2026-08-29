import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { currentActor } from "@/modules/auth/current-user";
import {
  listAdminPayouts,
  listPendingBeneficiaries,
} from "@/modules/offerings/payouts";
import { AdminAction } from "./admin-action";

export const dynamic = "force-dynamic";

const yuan = (m: number) => `¥${(m / 100).toFixed(2)}`;
const methodLabel = (m: string | null) =>
  m === "bank" ? "银行卡" : m === "usdt" ? "USDT" : m === "alipay" ? "支付宝" : "—";

/** Payout ops: activate beneficiaries and settle gift-out requests. */
export default async function AdminPayoutsPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  const actor = await currentActor();
  if (actor.platformRole !== "super_admin") {
    notFound();
  }

  const [pending, requests] = await Promise.all([
    listPendingBeneficiaries(),
    listAdminPayouts({ openOnly: true }),
  ]);

  return (
    <div className="stack-lg">
      <h1>提款 · 转赠审核</h1>
      <p className="muted">
        实名审核家属受益人，并处理转赠申请。核对后用站外通道（Wise/Airwallex/支付宝）
        打款，再标记「已打款」。
      </p>

      <section className="stack">
        <h2>待审核受益人</h2>
        {pending.length > 0 ? (
          <div className="adminTableWrap">
            <table className="adminTable">
              <thead>
                <tr>
                  <th>纪念页</th>
                  <th>真实姓名</th>
                  <th>方式</th>
                  <th>收款账号</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((b) => (
                  <tr key={b.id}>
                    <td>{b.memorialName ?? "—"}</td>
                    <td>{b.legalName}</td>
                    <td>{methodLabel(b.method)}</td>
                    <td>{b.account ?? "—"}</td>
                    <td>
                      <AdminAction
                        url={`/api/admin/beneficiaries/${b.id}`}
                        actions={[
                          { label: "通过", body: { status: "active" }, primary: true },
                          { label: "暂停", body: { status: "suspended" } },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">没有待审核的受益人。</p>
        )}
      </section>

      <section className="stack">
        <h2>待处理转赠申请</h2>
        {requests.length > 0 ? (
          <div className="adminTableWrap">
            <table className="adminTable">
              <thead>
                <tr>
                  <th>申请时间</th>
                  <th>纪念页</th>
                  <th>收款人</th>
                  <th>方式 · 账号</th>
                  <th>金额</th>
                  <th>手续费</th>
                  <th>应付净额</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td>{r.requestedAt.toLocaleDateString(locale)}</td>
                    <td>{r.memorialName ?? "—"}</td>
                    <td>{r.legalName}</td>
                    <td>
                      {methodLabel(r.method)} · {r.account ?? "—"}
                    </td>
                    <td>{yuan(r.grossMinor)}</td>
                    <td className="muted">−{yuan(r.platformFeeMinor)}</td>
                    <td>
                      <b>{yuan(r.netMinor)}</b>
                    </td>
                    <td>
                      <AdminAction
                        url={`/api/admin/payouts/${r.id}`}
                        actions={[
                          {
                            label: "已打款",
                            body: { decision: "paid" },
                            promptKey: "providerRef",
                            promptText: "打款凭证/流水号（可留空）",
                            primary: true,
                          },
                          { label: "拒绝", body: { decision: "rejected" } },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">没有待处理的转赠申请。</p>
        )}
      </section>
    </div>
  );
}

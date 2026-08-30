import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { currentActor } from "@/modules/auth/current-user";
import {
  queueCounts,
  reportQueue,
  disputeQueue,
  ritualReviewQueue,
  unassignedCases,
} from "@/modules/governance/admin-queries";
import { listAdminOrders } from "@/modules/offerings/orders-admin";

export default async function AdminDashboard(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  const actor = await currentActor();
  const [counts, reports, disputes, rituals, cases] = await Promise.all([
    queueCounts(actor),
    reportQueue(actor, { limit: 5 }),
    disputeQueue(actor, { limit: 5 }),
    ritualReviewQueue(actor, { limit: 5 }),
    unassignedCases(actor, { limit: 5 }),
  ]);

  if (!counts.ok) return null;

  const isSuperAdmin = actor.platformRole === "super_admin";
  let revenue: Awaited<ReturnType<typeof listAdminOrders>> | null = null;
  if (isSuperAdmin) {
    try {
      revenue = await listAdminOrders({ limit: 1 });
    } catch {
      revenue = null;
    }
  }
  const yuan = (minor: number) => `¥${(minor / 100).toFixed(2)}`;

  return (
    <div className="stack-lg">
      <h1>仪表盘</h1>

      <section className="adminCardGrid" aria-labelledby="counts-heading">
        <h2 id="counts-heading" className="srOnly">队列概览</h2>
        <Link href={`/${locale}/admin/reports`} className="adminCard" data-testid="count-reports">
          <span className="adminCardCount">{counts.value.openReports}</span>
          <span className="adminCardLabel">待处理举报</span>
        </Link>
        <Link href={`/${locale}/admin/disputes`} className="adminCard" data-testid="count-disputes">
          <span className="adminCardCount">{counts.value.openDisputes}</span>
          <span className="adminCardLabel">归属申诉</span>
        </Link>
        <Link href={`/${locale}/admin/rituals`} className="adminCard" data-testid="count-rituals">
          <span className="adminCardCount">{counts.value.ritualsAwaitingReview}</span>
          <span className="adminCardLabel">仪式修订</span>
        </Link>
        {cases.ok ? (
          <Link href={`/${locale}/admin/cases`} className="adminCard">
            <span className="adminCardCount">{cases.value.length}</span>
            <span className="adminCardLabel">未分配工单</span>
          </Link>
        ) : null}
        {revenue ? (
          <Link href={`/${locale}/admin/orders`} className="adminCard">
            <span className="adminCardCount">{yuan(revenue.totals.grossMinor)}</span>
            <span className="adminCardLabel">
              累计收款 · {revenue.totals.count} 单
            </span>
          </Link>
        ) : null}
      </section>

      <section data-testid="queue-reports" aria-labelledby="reports-heading">
        <h2 id="reports-heading">最近举报</h2>
        {reports.ok && reports.value.length > 0 ? (
          <table className="adminTable">
            <thead>
              <tr>
                <th>分类</th>
                <th>对象</th>
                <th>状态</th>
                <th>日期</th>
              </tr>
            </thead>
            <tbody>
              {reports.value.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link href={`/${locale}/admin/reports/${r.id}`} className="adminLink">
                      {r.category}
                    </Link>
                  </td>
                  <td>{r.resourceType}</td>
                  <td><span className={`adminBadge adminBadge--${r.status}`}>{r.status}</span></td>
                  <td>{r.createdAt.toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">暂无待处理举报。</p>
        )}
      </section>

      <section data-testid="queue-disputes" aria-labelledby="disputes-heading">
        <h2 id="disputes-heading">最近归属申诉</h2>
        {disputes.ok && disputes.value.length > 0 ? (
          <table className="adminTable">
            <thead>
              <tr>
                <th>关系</th>
                <th>状态</th>
                <th>证据</th>
                <th>日期</th>
              </tr>
            </thead>
            <tbody>
              {disputes.value.map((d) => (
                <tr key={d.id}>
                  <td>
                    <Link href={`/${locale}/admin/disputes/${d.id}`} className="adminLink">
                      {d.claimedRelationship}
                    </Link>
                  </td>
                  <td><span className={`adminBadge adminBadge--${d.status}`}>{d.status}</span></td>
                  <td>{d.evidenceCount} 份材料</td>
                  <td>{d.createdAt.toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">暂无待处理申诉。</p>
        )}
      </section>

      <section data-testid="queue-rituals" aria-labelledby="rituals-heading">
        <h2 id="rituals-heading">仪式修订</h2>
        {rituals.ok && rituals.value.length > 0 ? (
          <table className="adminTable">
            <thead>
              <tr>
                <th>版本</th>
                <th>状态</th>
                <th>审核人</th>
              </tr>
            </thead>
            <tbody>
              {rituals.value.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link href={`/${locale}/admin/rituals/${r.id}`} className="adminLink">
                      v{r.version}
                    </Link>
                  </td>
                  <td><span className={`adminBadge adminBadge--${r.status}`}>{r.status}</span></td>
                  <td>{r.hasReviewer ? "已分配" : "未分配"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">暂无待审核的修订。</p>
        )}
      </section>

      {isSuperAdmin ? (
        <section data-testid="super-admin-only" aria-labelledby="publishing-heading">
          <h2 id="publishing-heading">发布</h2>
          <p className="muted">
            发布仪式修订必须填写理由。缺少来源、适用范围、指定审核人或人工审核过的译文，修订都无法发布。
          </p>
        </section>
      ) : null}
    </div>
  );
}

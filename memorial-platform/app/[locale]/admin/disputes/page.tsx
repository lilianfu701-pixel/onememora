import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { currentActor } from "@/modules/auth/current-user";
import { disputeQueue } from "@/modules/governance/admin-queries";

export default async function DisputesPage(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ offset?: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const query = await props.searchParams;
  const offset = Math.max(Number(query.offset) || 0, 0);

  const actor = await currentActor();
  const result = await disputeQueue(actor, { limit: 25, offset });

  if (!result.ok) return null;

  return (
    <div className="stack-lg">
      <h1>归属申诉</h1>
      {result.value.length > 0 ? (
        <>
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
              {result.value.map((d) => (
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
          {result.value.length >= 25 ? (
            <Link
              href={`/${locale}/admin/disputes?offset=${offset + 25}`}
              className="button buttonQuiet"
            >
              下一页
            </Link>
          ) : null}
        </>
      ) : (
        <p className="muted">暂无待处理申诉。</p>
      )}
    </div>
  );
}

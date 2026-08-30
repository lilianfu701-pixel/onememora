import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { currentActor } from "@/modules/auth/current-user";
import { reportQueue } from "@/modules/governance/admin-queries";

export default async function ReportsPage(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ offset?: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const query = await props.searchParams;
  const offset = Math.max(Number(query.offset) || 0, 0);

  const actor = await currentActor();
  const result = await reportQueue(actor, { limit: 25, offset });

  if (!result.ok) return null;

  return (
    <div className="stack-lg">
      <h1>举报</h1>
      {result.value.length > 0 ? (
        <>
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
              {result.value.map((r) => (
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
          {result.value.length >= 25 ? (
            <Link
              href={`/${locale}/admin/reports?offset=${offset + 25}`}
              className="button buttonQuiet"
            >
              下一页
            </Link>
          ) : null}
        </>
      ) : (
        <p className="muted">暂无待处理举报。</p>
      )}
    </div>
  );
}

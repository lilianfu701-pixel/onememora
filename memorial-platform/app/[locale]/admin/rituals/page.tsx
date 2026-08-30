import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { currentActor } from "@/modules/auth/current-user";
import { ritualReviewQueue } from "@/modules/governance/admin-queries";

export default async function RitualsPage(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ offset?: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const query = await props.searchParams;
  const offset = Math.max(Number(query.offset) || 0, 0);

  const actor = await currentActor();
  const result = await ritualReviewQueue(actor, { limit: 25, offset });

  if (!result.ok) return null;

  return (
    <div className="stack-lg">
      <h1>仪式修订</h1>
      {result.value.length > 0 ? (
        <>
          <table className="adminTable">
            <thead>
              <tr>
                <th>版本</th>
                <th>状态</th>
                <th>审核人</th>
              </tr>
            </thead>
            <tbody>
              {result.value.map((r) => (
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
          {result.value.length >= 25 ? (
            <Link
              href={`/${locale}/admin/rituals?offset=${offset + 25}`}
              className="button buttonQuiet"
            >
              下一页
            </Link>
          ) : null}
        </>
      ) : (
        <p className="muted">暂无待审核的修订。</p>
      )}
    </div>
  );
}

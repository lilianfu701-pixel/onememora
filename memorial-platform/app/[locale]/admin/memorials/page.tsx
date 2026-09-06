import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { emailCredentials, memorialNames, memorials, users } from "@/db/schema";
import { currentActor } from "@/modules/auth/current-user";
import { canGovern } from "@/modules/permissions/policy";

const PAGE = 25;

const STATUS_LABEL: Record<string, string> = {
  draft: "草稿",
  published: "已发布",
  restricted: "受限",
  hidden: "隐藏",
  pending_deletion: "待删除",
  merged: "已合并",
};
const VISIBILITY_LABEL: Record<string, string> = {
  public: "公开",
  unlisted: "不公开列出",
  invite_only: "仅邀请",
};

export default async function AdminMemorialsPage(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; offset?: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  const actor = await currentActor();
  if (!canGovern({ actor, action: "restrict_editing" })) return null;

  const query = await props.searchParams;
  const offset = Math.max(Number(query.offset) || 0, 0);
  const search = query.q?.trim() || undefined;

  const where = search
    ? or(
        ilike(memorialNames.value, `%${search}%`),
        eq(memorials.publicNumber, search),
      )
    : undefined;

  const rows = await db()
    .select({
      id: memorials.id,
      slug: memorials.slug,
      publicNumber: memorials.publicNumber,
      status: memorials.status,
      visibility: memorials.visibility,
      stewardedAt: memorials.stewardedByAdminAt,
      createdAt: memorials.createdAt,
      name: memorialNames.value,
      ownerName: users.fullName,
      ownerEmail: emailCredentials.email,
    })
    .from(memorials)
    .leftJoin(
      memorialNames,
      and(
        eq(memorialNames.memorialId, memorials.id),
        eq(memorialNames.type, "primary"),
      ),
    )
    .leftJoin(users, eq(users.id, memorials.ownerUserId))
    .leftJoin(emailCredentials, eq(emailCredentials.userId, users.id))
    .where(where)
    .orderBy(desc(memorials.createdAt))
    .limit(PAGE)
    .offset(offset);

  const countRows = await db()
    .select({ total: sql<number>`count(distinct ${memorials.id})::int` })
    .from(memorials)
    .leftJoin(
      memorialNames,
      and(
        eq(memorialNames.memorialId, memorials.id),
        eq(memorialNames.type, "primary"),
      ),
    )
    .where(where);
  const total = countRows[0]?.total ?? 0;

  return (
    <div className="stack-lg">
      <h1>追思页统计（{total}）</h1>
      <form method="get" className="searchForm" style={{ maxWidth: "26rem" }}>
        <label className="field">
          <span className="fieldLabel">按姓名或 8 位编号搜索</span>
          <input
            className="input"
            type="search"
            name="q"
            defaultValue={search ?? ""}
            placeholder="姓名 或 编号…"
          />
        </label>
        <button className="button buttonPrimary" type="submit">
          搜索
        </button>
      </form>

      {rows.length > 0 ? (
        <>
          <div style={{ overflowX: "auto" }}>
            <table
              className="adminTable"
              style={{ tableLayout: "fixed", width: "100%" }}
            >
              <colgroup>
                <col style={{ width: "9%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "13%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>编号</th>
                  <th>姓名</th>
                  <th>状态</th>
                  <th>可见性</th>
                  <th>代建待认领</th>
                  <th>创建人姓名</th>
                  <th>创建人邮箱</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.id}>
                    <td>{m.publicNumber ?? "—"}</td>
                    <td style={{ wordBreak: "break-word" }}>
                      <Link
                        href={`/${locale}/memorials/${m.slug}`}
                        target="_blank"
                      >
                        {m.name || "—"}
                      </Link>
                    </td>
                    <td>{STATUS_LABEL[m.status] ?? m.status}</td>
                    <td>{VISIBILITY_LABEL[m.visibility] ?? m.visibility}</td>
                    <td>{m.stewardedAt ? "是" : "否"}</td>
                    <td style={{ wordBreak: "break-word" }}>
                      {m.ownerName || "—"}
                    </td>
                    <td style={{ wordBreak: "break-all" }}>
                      {m.ownerEmail || "—"}
                    </td>
                    <td>{m.createdAt.toLocaleDateString()}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <Link
                        href={`/${locale}/memorials/${m.slug}`}
                        target="_blank"
                      >
                        查看
                      </Link>
                      <span className="muted"> · </span>
                      <Link
                        href={`/${locale}/memorials/${m.slug}/manage`}
                        target="_blank"
                      >
                        管理
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length >= PAGE ? (
            <a
              href={`/${locale}/admin/memorials?offset=${offset + PAGE}${
                search ? `&q=${encodeURIComponent(search)}` : ""
              }`}
              className="button buttonQuiet"
            >
              下一页
            </a>
          ) : null}
        </>
      ) : (
        <p className="muted">未找到追思页。</p>
      )}
    </div>
  );
}

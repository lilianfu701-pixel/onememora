import { setRequestLocale } from "next-intl/server";
import { currentActor } from "@/modules/auth/current-user";
import { canGovern } from "@/modules/permissions/policy";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { desc, ilike, sql } from "drizzle-orm";
import { RoleSelect } from "./role-select";

const ROLE_LABEL: Record<string, string> = {
  user: "普通用户",
  reviewer: "审核员",
  super_admin: "超级管理员",
};
const roleLabel = (r: string): string => ROLE_LABEL[r] ?? r;

export default async function UsersPage(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; offset?: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const query = await props.searchParams;
  const offset = Math.max(Number(query.offset) || 0, 0);
  const search = query.q?.trim() || undefined;

  const actor = await currentActor();
  if (!canGovern({ actor, action: "restrict_editing" })) return null;
  const isSuperAdmin = actor.platformRole === "super_admin";

  const where = search
    ? ilike(users.fullName, `%${search}%`)
    : undefined;

  const rows = await db()
    .select({
      id: users.id,
      fullName: users.fullName,
      platformRole: users.platformRole,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(where)
    .orderBy(desc(users.createdAt))
    .limit(25)
    .offset(offset);

  const countRows = await db()
    .select({ total: sql<number>`count(*)::int` })
    .from(users)
    .where(where);
  const total = countRows[0]?.total ?? 0;

  return (
    <div className="stack-lg">
      <h1>用户（{total}）</h1>
      <form method="get" className="searchForm" style={{ maxWidth: "24rem" }}>
        <label className="field">
          <span className="fieldLabel">按姓名搜索</span>
          <input
            className="input"
            type="search"
            name="q"
            defaultValue={search ?? ""}
            placeholder="姓名…"
          />
        </label>
        <button className="button buttonPrimary" type="submit">搜索</button>
      </form>
      {rows.length > 0 ? (
        <>
          <table className="adminTable">
            <thead>
              <tr>
                <th>姓名</th>
                <th>角色</th>
                <th>注册时间</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id}>
                  <td>{u.fullName || "—"}</td>
                  <td>
                    {isSuperAdmin && u.id !== actor.userId ? (
                      <RoleSelect userId={u.id} role={u.platformRole} />
                    ) : (
                      <span className="adminBadge">{roleLabel(u.platformRole)}</span>
                    )}
                  </td>
                  <td>{u.createdAt.toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length >= 25 ? (
            <a
              href={`/${locale}/admin/users?offset=${offset + 25}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
              className="button buttonQuiet"
            >
              下一页
            </a>
          ) : null}
        </>
      ) : (
        <p className="muted">未找到用户。</p>
      )}
    </div>
  );
}

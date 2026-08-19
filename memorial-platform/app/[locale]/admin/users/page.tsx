import { setRequestLocale } from "next-intl/server";
import { currentActor } from "@/modules/auth/current-user";
import { canGovern } from "@/modules/permissions/policy";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { desc, ilike, sql } from "drizzle-orm";

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
      <h1>Users ({total})</h1>
      <form method="get" className="searchForm" style={{ maxWidth: "24rem" }}>
        <label className="field">
          <span className="fieldLabel">Search by name</span>
          <input
            className="input"
            type="search"
            name="q"
            defaultValue={search ?? ""}
            placeholder="Full name…"
          />
        </label>
        <button className="button buttonPrimary" type="submit">Search</button>
      </form>
      {rows.length > 0 ? (
        <>
          <table className="adminTable">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id}>
                  <td>{u.fullName || "—"}</td>
                  <td><span className="adminBadge">{u.platformRole}</span></td>
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
              Next page
            </a>
          ) : null}
        </>
      ) : (
        <p className="muted">No users found.</p>
      )}
    </div>
  );
}

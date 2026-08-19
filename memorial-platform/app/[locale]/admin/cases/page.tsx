import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { currentActor } from "@/modules/auth/current-user";
import { unassignedCases } from "@/modules/governance/admin-queries";

export default async function CasesPage(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ offset?: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const query = await props.searchParams;
  const offset = Math.max(Number(query.offset) || 0, 0);

  const actor = await currentActor();
  const result = await unassignedCases(actor, { limit: 25, offset });

  if (!result.ok) return null;

  return (
    <div className="stack-lg">
      <h1>Unassigned Cases</h1>
      {result.value.length > 0 ? (
        <>
          <table className="adminTable">
            <thead>
              <tr>
                <th>Kind</th>
                <th>Opened</th>
              </tr>
            </thead>
            <tbody>
              {result.value.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/${locale}/admin/cases/${c.id}`} className="adminLink">
                      {c.kind}
                    </Link>
                  </td>
                  <td>{c.openedAt.toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {result.value.length >= 25 ? (
            <Link
              href={`/${locale}/admin/cases?offset=${offset + 25}`}
              className="button buttonQuiet"
            >
              Next page
            </Link>
          ) : null}
        </>
      ) : (
        <p className="muted">No unassigned cases.</p>
      )}
    </div>
  );
}

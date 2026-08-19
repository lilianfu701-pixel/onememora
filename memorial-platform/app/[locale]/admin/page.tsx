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

  return (
    <div className="stack-lg">
      <h1>Dashboard</h1>

      <section className="adminCardGrid" aria-labelledby="counts-heading">
        <h2 id="counts-heading" className="srOnly">Queue summary</h2>
        <Link href={`/${locale}/admin/reports`} className="adminCard" data-testid="count-reports">
          <span className="adminCardCount">{counts.value.openReports}</span>
          <span className="adminCardLabel">Open Reports</span>
        </Link>
        <Link href={`/${locale}/admin/disputes`} className="adminCard" data-testid="count-disputes">
          <span className="adminCardCount">{counts.value.openDisputes}</span>
          <span className="adminCardLabel">Ownership Claims</span>
        </Link>
        <Link href={`/${locale}/admin/rituals`} className="adminCard" data-testid="count-rituals">
          <span className="adminCardCount">{counts.value.ritualsAwaitingReview}</span>
          <span className="adminCardLabel">Ritual Revisions</span>
        </Link>
        {cases.ok ? (
          <Link href={`/${locale}/admin/cases`} className="adminCard">
            <span className="adminCardCount">{cases.value.length}</span>
            <span className="adminCardLabel">Unassigned Cases</span>
          </Link>
        ) : null}
      </section>

      <section data-testid="queue-reports" aria-labelledby="reports-heading">
        <h2 id="reports-heading">Recent Reports</h2>
        {reports.ok && reports.value.length > 0 ? (
          <table className="adminTable">
            <thead>
              <tr>
                <th>Category</th>
                <th>Resource</th>
                <th>Status</th>
                <th>Date</th>
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
          <p className="muted">No open reports.</p>
        )}
      </section>

      <section data-testid="queue-disputes" aria-labelledby="disputes-heading">
        <h2 id="disputes-heading">Recent Ownership Claims</h2>
        {disputes.ok && disputes.value.length > 0 ? (
          <table className="adminTable">
            <thead>
              <tr>
                <th>Relationship</th>
                <th>Status</th>
                <th>Evidence</th>
                <th>Date</th>
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
                  <td>{d.evidenceCount} doc(s)</td>
                  <td>{d.createdAt.toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">No open claims.</p>
        )}
      </section>

      <section data-testid="queue-rituals" aria-labelledby="rituals-heading">
        <h2 id="rituals-heading">Ritual Revisions</h2>
        {rituals.ok && rituals.value.length > 0 ? (
          <table className="adminTable">
            <thead>
              <tr>
                <th>Version</th>
                <th>Status</th>
                <th>Reviewer</th>
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
                  <td>{r.hasReviewer ? "Assigned" : "Unassigned"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">No revisions awaiting review.</p>
        )}
      </section>

      {isSuperAdmin ? (
        <section data-testid="super-admin-only" aria-labelledby="publishing-heading">
          <h2 id="publishing-heading">Publishing</h2>
          <p className="muted">
            Publishing a ritual revision requires a stated reason. A revision
            cannot be published without a source, an applicability scope, a named
            reviewer and a human-reviewed translation.
          </p>
        </section>
      ) : null}
    </div>
  );
}

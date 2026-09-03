"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Request = {
  id: string;
  kind: "takeover" | "join";
  requesterName: string;
  relationship: string;
  reason: string;
};

const RELATION_LABEL: Record<string, string> = {
  spouse: "relationshipSpouse",
  parent: "relationshipParent",
  child: "relationshipChild",
  sibling: "relationshipSibling",
};

export function TakeoverRequests(props: {
  memorialId: string;
  initial: Request[];
}) {
  const t = useTranslations("memorial");
  const common = useTranslations("common");
  const router = useRouter();

  const [requests, setRequests] = useState<Request[]>(props.initial);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function respond(
    id: string,
    action: "accept" | "decline",
  ): Promise<void> {
    if (busyId) return;
    setBusyId(id);
    try {
      const res = await fetch(
        `/api/memorials/${props.memorialId}/takeover/${id}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action }),
        },
      );
      if (res.ok) {
        setRequests((cur) => cur.filter((r) => r.id !== id));
        router.refresh();
      }
    } catch {
      /* leave the row; the owner can retry */
    } finally {
      setBusyId(null);
    }
  }

  if (requests.length === 0) {
    return (
      <div className="stack">
        <h2>{t("takeoverRequestsHeading")}</h2>
        <p className="muted" style={{ margin: 0 }}>
          {t("takeoverRequestsNone")}
        </p>
      </div>
    );
  }

  return (
    <div className="stack">
      <h2>{t("takeoverRequestsHeading")}</h2>
      <ul className="stack" style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {requests.map((r) => (
          <li key={r.id} className="takeoverRow stack">
            <p style={{ margin: 0 }}>
              <span className="adminBadge">
                {r.kind === "join" ? t("joinBadge") : t("takeoverBadge")}
              </span>{" "}
              <strong>{r.requesterName || t("someoneLabel")}</strong>
              <span className="muted">
                {" · "}
                {t(RELATION_LABEL[r.relationship] ?? "relationshipSibling")}
              </span>
            </p>
            <p className="muted" style={{ margin: 0 }}>
              {r.reason}
            </p>
            <div className="adminHeadRow">
              <button
                type="button"
                className="button buttonPrimary buttonCompact"
                disabled={busyId === r.id}
                onClick={() => respond(r.id, "accept")}
              >
                {busyId === r.id
                  ? common("loading")
                  : r.kind === "join"
                    ? t("joinAccept")
                    : t("takeoverAccept")}
              </button>
              <button
                type="button"
                className="button buttonQuiet buttonCompact"
                disabled={busyId === r.id}
                onClick={() => respond(r.id, "decline")}
              >
                {t("takeoverDecline")}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

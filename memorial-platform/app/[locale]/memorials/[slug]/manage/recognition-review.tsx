"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

type Claim = {
  id: string;
  claimedName: string;
  /** Already localized by the server. */
  relationLabel: string;
  /** The claimant passed the kinship knowledge check. */
  kinshipVerified: boolean;
};

/**
 * Where a memorial's keeper answers recognition claims. Each row is one person
 * saying "I am this relative"; confirming or declining resolves it and drops the
 * row. Optimistic — the row leaves at once and comes back only if the request
 * fails.
 */
export function RecognitionReview(props: {
  memorialId: string;
  initial: Claim[];
}) {
  const t = useTranslations("memorial");
  const [claims, setClaims] = useState<Claim[]>(props.initial);
  const [busy, setBusy] = useState<string | null>(null);

  async function decide(
    claim: Claim,
    decision: "confirmed" | "rejected",
  ): Promise<void> {
    if (busy) return;
    setBusy(claim.id);
    const remaining = claims.filter((row) => row.id !== claim.id);
    setClaims(remaining);
    try {
      const response = await fetch(
        `/api/memorials/${props.memorialId}/recognition-claims/${claim.id}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ decision }),
        },
      );
      if (!response.ok) {
        setClaims((current) => [claim, ...current]);
      }
    } catch {
      setClaims((current) => [claim, ...current]);
    } finally {
      setBusy(null);
    }
  }

  if (claims.length === 0) {
    return null;
  }

  return (
    <section className="stack card recognitionReview">
      <div className="stack">
        <h2>{t("recognitionReviewTitle")}</h2>
        <p className="muted">{t("recognitionReviewHint")}</p>
      </div>
      <ul className="recognitionList">
        {claims.map((claim) => (
          <li className="recognitionItem" key={claim.id}>
            <span className="recognitionSummary">
              {t("recognitionClaimSummary", {
                name: claim.claimedName,
                relation: claim.relationLabel,
              })}
              {claim.kinshipVerified ? (
                <span className="recognitionVerified">
                  ✓ {t("claimKinshipVerified")}
                </span>
              ) : null}
            </span>
            <div className="recognitionActions">
              <button
                type="button"
                className="button buttonPrimary buttonCompact"
                onClick={() => decide(claim, "confirmed")}
                disabled={busy === claim.id}
              >
                {t("recognitionConfirm")}
              </button>
              <button
                type="button"
                className="button buttonQuiet buttonCompact"
                onClick={() => decide(claim, "rejected")}
                disabled={busy === claim.id}
              >
                {t("recognitionReject")}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

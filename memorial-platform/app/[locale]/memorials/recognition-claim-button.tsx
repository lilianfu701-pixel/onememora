"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

type ClaimState =
  | "none"
  | "submitting"
  | "pending"
  | "confirmed"
  | "rejected"
  | "withdrawn"
  | "error";

function initialState(status: string | null): ClaimState {
  switch (status) {
    case "pending":
    case "escalated":
      return "pending";
    case "confirmed":
      return "confirmed";
    case "rejected":
      return "rejected";
    case "withdrawn":
      return "withdrawn";
    default:
      return "none";
  }
}

/**
 * "This is me" — the account holder claims the relative a public memorial listed
 * under their name. One claim per memorial; the button reflects where the claim
 * stands and only offers the action again after a rejection or withdrawal.
 */
export function RecognitionClaimButton(props: {
  memorialId: string;
  claimedName: string;
  claimedRelationship: string;
  initialStatus: string | null;
}) {
  const t = useTranslations("memorial");
  const [state, setState] = useState<ClaimState>(
    initialState(props.initialStatus),
  );

  async function claim(): Promise<void> {
    if (state === "submitting") return;
    setState("submitting");
    try {
      const response = await fetch(
        `/api/memorials/${props.memorialId}/recognition-claims`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            claimedName: props.claimedName,
            claimedRelationship: props.claimedRelationship,
          }),
        },
      );
      // 201 created, or 422 because a pending claim already exists — either way
      // the honest state to show is "awaiting confirmation".
      if (response.ok || response.status === 422) {
        setState("pending");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  if (state === "pending") {
    return <span className="claimStatus claimStatusPending">{t("claimPending")}</span>;
  }
  if (state === "confirmed") {
    return (
      <span className="claimStatus claimStatusConfirmed">{t("claimConfirmed")}</span>
    );
  }

  const canClaim = state === "none" || state === "rejected" || state === "withdrawn" || state === "error";

  return (
    <div className="claimAction">
      {state === "rejected" ? (
        <span className="claimStatus claimStatusRejected">{t("claimRejected")}</span>
      ) : null}
      {state === "error" ? (
        <span className="claimStatus claimStatusError">{t("claimError")}</span>
      ) : null}
      <button
        type="button"
        className="button buttonPrimary buttonCompact"
        onClick={claim}
        disabled={!canClaim}
      >
        {state === "submitting" ? t("claimSubmitting") : t("claimThisIsMe")}
      </button>
    </div>
  );
}

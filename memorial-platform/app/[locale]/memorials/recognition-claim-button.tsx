"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

type ClaimState =
  | "none"
  | "checking"
  | "challenge"
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
 * under their name. When the memorial has a hidden relative, a knowledge check
 * ("name the deceased's …") is offered first: passing it is evidence for the
 * owner, who still confirms. A claimant may skip it and go to manual review.
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
  const [challengeRel, setChallengeRel] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");

  const relLabel = (rel: string): string =>
    t.has(`relationship_${rel}`) ? t(`relationship_${rel}`) : rel;

  async function submitClaim(
    challenge?: { relationship: string; answer: string },
  ): Promise<void> {
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
            ...(challenge
              ? {
                  challengeRelationship: challenge.relationship,
                  challengeAnswer: challenge.answer,
                }
              : {}),
          }),
        },
      );
      if (response.ok || response.status === 422) {
        setState("pending");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  async function startClaim(): Promise<void> {
    if (state === "checking" || state === "submitting") return;
    setState("checking");
    try {
      const res = await fetch(
        `/api/memorials/${props.memorialId}/recognition-challenge`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ claimedName: props.claimedName }),
        },
      );
      const data = res.ok ? (await res.json())?.data : null;
      if (data?.available && data.relationship) {
        setChallengeRel(data.relationship);
        setAnswer("");
        setState("challenge");
      } else {
        // No challenge to offer — claim straight away, manual review as before.
        await submitClaim();
      }
    } catch {
      // A failed check should not block the claim.
      await submitClaim();
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

  if (state === "challenge" && challengeRel) {
    return (
      <form
        className="claimChallenge"
        onSubmit={(e) => {
          e.preventDefault();
          submitClaim({ relationship: challengeRel, answer });
        }}
      >
        <label className="field">
          <span className="fieldLabel">
            {t("challengeIntro", { relationship: relLabel(challengeRel) })}
          </span>
          <input
            className="input"
            type="text"
            maxLength={200}
            autoFocus
            placeholder={t("challengePlaceholder")}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
        </label>
        <div className="claimChallengeActions">
          <button
            type="button"
            className="button buttonQuiet buttonCompact"
            onClick={() => submitClaim()}
          >
            {t("challengeSkip")}
          </button>
          <button
            type="submit"
            className="button buttonPrimary buttonCompact"
            disabled={answer.trim().length === 0}
          >
            {t("challengeSubmit")}
          </button>
        </div>
      </form>
    );
  }

  const canClaim =
    state === "none" ||
    state === "rejected" ||
    state === "withdrawn" ||
    state === "error";

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
        onClick={startClaim}
        disabled={!canClaim}
      >
        {state === "checking" || state === "submitting"
          ? t("claimSubmitting")
          : t("claimThisIsMe")}
      </button>
    </div>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Platform override shown only to a super admin who does not own this page:
 * one click takes ownership, with no request or grace period.
 */
export function AdminReclaim(props: { memorialId: string }) {
  const t = useTranslations("memorial");
  const router = useRouter();
  const [state, setState] = useState<"idle" | "working" | "error">("idle");

  async function reclaim(): Promise<void> {
    if (state === "working") return;
    if (!window.confirm(t("adminReclaimConfirm"))) return;
    setState("working");
    try {
      const res = await fetch(
        `/api/memorials/${props.memorialId}/admin-reclaim`,
        { method: "POST" },
      );
      if (res.ok) {
        router.refresh();
        setState("idle");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  return (
    <div className="adminReclaim">
      <span className="adminReclaimLabel">{t("adminReclaimNote")}</span>
      <button
        type="button"
        className="button buttonQuiet buttonCompact"
        onClick={reclaim}
        disabled={state === "working"}
      >
        {state === "working" ? t("adminReclaimWorking") : t("adminReclaim")}
      </button>
      {state === "error" ? (
        <span className="fieldError">{t("adminReclaimFailed")}</span>
      ) : null}
    </div>
  );
}

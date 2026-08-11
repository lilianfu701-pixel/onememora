"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteMemorialButton(props: { memorialId: string }) {
  const t = useTranslations("memorial");
  const common = useTranslations("common");
  const errors = useTranslations("errors");
  const router = useRouter();

  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [failed, setFailed] = useState(false);

  async function doDelete(): Promise<void> {
    setDeleting(true);
    setFailed(false);
    try {
      const response = await fetch(`/api/memorials/${props.memorialId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        setFailed(true);
        setDeleting(false);
        return;
      }
      // The list query excludes deleted memorials, so a refresh drops the card.
      router.refresh();
    } catch {
      setFailed(true);
      setDeleting(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        className="linkButton memorialCardDelete"
        onClick={() => setConfirming(true)}
      >
        {common("remove")}
      </button>
    );
  }

  return (
    <div className="memorialCardConfirm">
      <span className="memorialCardConfirmText">
        {t("deleteConfirmQuestion")}
      </span>
      <button
        type="button"
        className="button buttonQuiet buttonCompact"
        disabled={deleting}
        onClick={() => setConfirming(false)}
      >
        {common("cancel")}
      </button>
      <button
        type="button"
        className="button buttonPrimary buttonCompact"
        disabled={deleting}
        onClick={doDelete}
      >
        {deleting ? common("loading") : common("remove")}
      </button>
      {failed ? (
        <span className="fieldError">{errors("unexpected")}</span>
      ) : null}
    </div>
  );
}

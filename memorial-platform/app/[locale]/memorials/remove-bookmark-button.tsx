"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** Drops a memorial from the viewer's bookmarks and refreshes the list. */
export function RemoveBookmarkButton(props: { memorialId: string }) {
  const t = useTranslations("memorial");
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function remove(): Promise<void> {
    if (saving) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/memorials/${props.memorialId}/bookmark`, {
        method: "DELETE",
      });
      if (response.ok) router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      type="button"
      className="button buttonQuiet buttonCompact"
      onClick={remove}
      disabled={saving}
    >
      {t("removeBookmark")}
    </button>
  );
}

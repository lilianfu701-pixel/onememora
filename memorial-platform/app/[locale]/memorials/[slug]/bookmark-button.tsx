"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

/**
 * Keeps a memorial on the viewer's private shortlist. Optimistic: the star
 * flips at once and only reverts if the request fails.
 */
export function BookmarkButton(props: {
  memorialId: string;
  initialBookmarked: boolean;
}) {
  const t = useTranslations("memorial");
  const [bookmarked, setBookmarked] = useState(props.initialBookmarked);
  const [saving, setSaving] = useState(false);

  async function toggle(): Promise<void> {
    if (saving) return;
    const next = !bookmarked;
    setSaving(true);
    setBookmarked(next);
    try {
      const response = await fetch(`/api/memorials/${props.memorialId}/bookmark`, {
        method: next ? "POST" : "DELETE",
      });
      if (!response.ok) setBookmarked(!next);
    } catch {
      setBookmarked(!next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      type="button"
      className={
        bookmarked
          ? "button buttonQuiet buttonCompact bookmarkOn"
          : "button buttonQuiet buttonCompact"
      }
      onClick={toggle}
      disabled={saving}
      aria-pressed={bookmarked}
    >
      <span aria-hidden="true">{bookmarked ? "★ " : "☆ "}</span>
      {bookmarked ? t("bookmarked") : t("bookmark")}
    </button>
  );
}

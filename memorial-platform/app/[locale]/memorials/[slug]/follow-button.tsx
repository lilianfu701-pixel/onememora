"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

/**
 * Follow a memorial to receive its reminder emails (death anniversary, and the
 * festivals for Chinese users). Optimistic toggle.
 */
export function FollowButton(props: {
  memorialId: string;
  initialFollowing: boolean;
}) {
  const t = useTranslations("memorial");
  const [following, setFollowing] = useState(props.initialFollowing);
  const [saving, setSaving] = useState(false);

  async function toggle(): Promise<void> {
    if (saving) return;
    const next = !following;
    setSaving(true);
    setFollowing(next);
    try {
      const response = await fetch(`/api/memorials/${props.memorialId}/follow`, {
        method: next ? "POST" : "DELETE",
      });
      if (!response.ok) setFollowing(!next);
    } catch {
      setFollowing(!next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      type="button"
      className={
        following
          ? "button buttonQuiet buttonCompact bookmarkOn"
          : "button buttonQuiet buttonCompact"
      }
      onClick={toggle}
      disabled={saving}
      aria-pressed={following}
      title={t("followHint")}
    >
      <span aria-hidden="true">{following ? "🔔 " : "🔕 "}</span>
      {following ? t("following") : t("follow")}
    </button>
  );
}

"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * The draft reminder shown to the owner of an unpublished memorial.
 *
 * A memorial created through the obituary flow arrives here barely filled in, so
 * the panel first points the family to the manage page to complete it (life
 * story, portrait, what visitors may offer), and only then offers to publish.
 * Publishing carries its own public-exposure consent implicitly — the family
 * asked for it by pressing the button — so there is no separate checkbox.
 */
export function PublishPanel(props: {
  memorialId: string;
  manageHref: string;
}) {
  const t = useTranslations("memorial");
  const common = useTranslations("common");
  const errors = useTranslations("errors");
  const router = useRouter();

  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  async function publish(): Promise<void> {
    setSending(true);
    setFailure(null);
    try {
      const response = await fetch(
        `/api/memorials/${props.memorialId}/publish`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ confirmPublicExposure: true }),
        },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setFailure(body?.error?.code ?? "unexpected");
        return;
      }
      router.refresh();
    } catch {
      setFailure("DEPENDENCY_UNAVAILABLE");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="notice noticePending stack">
      <strong>{t("draftNoticeTitle")}</strong>
      <p>{t("draftNoticeBody")}</p>

      <div className="adminHeadRow">
        <Link
          className="button buttonPrimary buttonCompact"
          href={props.manageHref}
        >
          {t("manageLink")}
        </Link>
        <button
          type="button"
          className="button buttonQuiet buttonCompact"
          disabled={sending}
          onClick={publish}
        >
          {sending ? common("loading") : t("publish")}
        </button>
      </div>

      {failure ? (
        <p className="fieldError" role="alert">
          {errors.has(failure) ? errors(failure) : failure}
        </p>
      ) : null}
    </div>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

/**
 * One button that publishes everything the family has saved — the life story
 * and every life chapter — in a single step, so the page has one place to make
 * their words go live rather than a publish control on each block.
 *
 * Saving a block (biography, chapter) writes a private draft; this button turns
 * those drafts into what visitors see. The final-disposition record has no
 * separate draft and is already live once saved, so it needs nothing here.
 */

// A publish call that finds nothing new to publish is not a failure: the block
// simply had no draft ahead of what is already live.
const BENIGN_CODES = new Set([
  "NOTHING_TO_PUBLISH",
  "CONTENT_NOT_FOUND",
  "MEMORIAL_NOT_FOUND",
]);

export function PublishAll(props: {
  memorialId: string;
  locale: string;
  slug: string;
  /** True when a biography draft is waiting to go live. */
  publishBiography: boolean;
  /** Chapters with a saved draft that is not yet the published version. */
  chapterIds: string[];
}) {
  const t = useTranslations("memorial");
  const common = useTranslations("common");
  const router = useRouter();
  const [state, setState] = useState<"idle" | "publishing" | "done" | "error">(
    "idle",
  );

  const nothingToPublish =
    !props.publishBiography && props.chapterIds.length === 0;

  async function postPublish(url: string): Promise<boolean> {
    try {
      const res = await fetch(url, { method: "POST" });
      if (res.ok) return true;
      const code = (
        (await res.json().catch(() => null)) as {
          error?: { code?: string };
        } | null
      )?.error?.code;
      return code !== undefined && BENIGN_CODES.has(code);
    } catch {
      return false;
    }
  }

  async function publishAll(): Promise<void> {
    if (state === "publishing" || nothingToPublish) return;
    setState("publishing");

    const calls: Promise<boolean>[] = [];
    if (props.publishBiography) {
      calls.push(
        postPublish(`/api/memorials/${props.memorialId}/biography/publish`),
      );
    }
    for (const id of props.chapterIds) {
      calls.push(
        postPublish(`/api/memorials/${props.memorialId}/chapters/${id}/publish`),
      );
    }

    const results = await Promise.all(calls);
    if (results.every(Boolean)) {
      setState("done");
      router.refresh();
    } else {
      setState("error");
    }
  }

  return (
    <div className="publishAllBar stack">
      <button
        type="button"
        className="button buttonPrimary"
        onClick={publishAll}
        disabled={state === "publishing" || nothingToPublish}
      >
        {state === "publishing" ? common("loading") : t("saveAndPublishAll")}
      </button>
      {state === "done" ? (
        <p className="notice" role="status">
          {t("publishedAll")}{" "}
          <Link href={`/${props.locale}/memorials/${props.slug}`}>
            {t("viewMemorial")} →
          </Link>
        </p>
      ) : null}
      {state === "error" ? (
        <p className="fieldError" role="alert">
          {t("obituaryPublishFailed")}
        </p>
      ) : null}
    </div>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PendingContribution } from "@/modules/memorials/contributions";

export function ContributionsReview(props: {
  memorialId: string;
  locale: string;
  initial: PendingContribution[];
}) {
  const t = useTranslations("contributions");
  const tc = useTranslations("lifeChapters");
  const router = useRouter();

  const [items, setItems] = useState<PendingContribution[]>(props.initial);
  const [pending, setPending] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const chapterTitle = (key: string, custom: string | null): string =>
    custom ?? (tc.has(`titles.${key}`) ? tc(`titles.${key}`) : tc("titles.custom"));

  async function decide(
    id: string,
    decision: "published" | "rejected",
  ): Promise<void> {
    if (pending) return;
    setPending(id);
    setFailed(false);
    try {
      const res = await fetch(
        `/api/memorials/${props.memorialId}/contributions/${id}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ decision }),
        },
      );
      if (!res.ok) {
        setFailed(true);
        return;
      }
      setItems((current) => current.filter((c) => c.id !== id));
      router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="stack contributionsReview">
      <h2>{t("reviewTitle")}</h2>

      {failed ? (
        <p className="fieldError" role="alert">
          {t("reviewFailed")}
        </p>
      ) : null}

      {items.length === 0 ? (
        <p className="muted">{t("reviewEmpty")}</p>
      ) : (
        <div className="stack">
          {items.map((c) => (
            <div key={c.id} className="card stack contributionReviewCard">
              <div className="contributionReviewHead">
                <span className="contributionReviewWho">
                  {c.name?.trim() || t("anonymous")}
                  {c.relation?.trim() ? `（${c.relation.trim()}）` : ""}
                </span>
                {c.chapterKey ? (
                  <span className="contributionTag">
                    {t("aboutChapter", {
                      title: chapterTitle(c.chapterKey, c.chapterCustomTitle),
                    })}
                  </span>
                ) : null}
              </div>

              <p className="contributionReviewBody">{c.body}</p>

              {c.photos.length > 0 ? (
                <div className="contributionPhotos">
                  {c.photos.map((p) =>
                    p.status === "ready" && p.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={p.mediaId}
                        className="contributionPhoto"
                        src={p.url}
                        alt={p.caption ?? ""}
                        loading="lazy"
                      />
                    ) : (
                      <div key={p.mediaId} className="contributionPhotoPending">
                        …
                      </div>
                    ),
                  )}
                </div>
              ) : null}

              <div className="contributionReviewActions">
                <button
                  type="button"
                  className="button buttonQuiet buttonCompact"
                  disabled={pending !== null}
                  onClick={() => decide(c.id, "rejected")}
                >
                  {t("reject")}
                </button>
                <button
                  type="button"
                  className="button buttonPrimary buttonCompact"
                  disabled={pending !== null}
                  onClick={() => decide(c.id, "published")}
                >
                  {t("approve")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

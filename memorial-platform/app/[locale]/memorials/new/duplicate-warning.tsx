"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type Match = {
  slug: string;
  name: string | null;
  birthYear: number | null;
  deathYear: number | null;
};

/**
 * Warns, while a memorial is being created, that a public memorial may already
 * describe this person — so a family can visit the existing page (and claim
 * their place on it) instead of unknowingly creating a second one. Advisory
 * only: it never blocks the form. Only public, published memorials appear, so
 * it cannot reveal a private one.
 */
export function DuplicateWarning(props: {
  locale: string;
  name: string;
  birthDate: string | null;
  deathDate: string | null;
}) {
  const t = useTranslations("memorial");
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    const name = props.name.trim();
    // Need a name and at least one date — a bare name is too weak to warn on.
    if (name.length < 2 || (!props.birthDate && !props.deathDate)) {
      setMatches([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/memorials/check-duplicates", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name,
            birthDate: props.birthDate,
            deathDate: props.deathDate,
          }),
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json())?.data?.matches ?? [];
        setMatches(data);
      } catch {
        /* aborted or offline — no warning is fine */
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [props.name, props.birthDate, props.deathDate]);

  if (matches.length === 0) return null;

  const years = (m: Match): string =>
    m.birthYear || m.deathYear ? `（${m.birthYear ?? ""}–${m.deathYear ?? ""}）` : "";

  return (
    <div className="dupWarning" role="status">
      <p className="dupWarningLead">{t("duplicateWarningLead")}</p>
      <ul className="dupWarningList">
        {matches.map((m) => (
          <li key={m.slug}>
            <a
              href={`/${props.locale}/memorials/${m.slug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {m.name ?? m.slug}
              {years(m)}
            </a>
          </li>
        ))}
      </ul>
      <p className="dupWarningHint">{t("duplicateWarningHint")}</p>
    </div>
  );
}

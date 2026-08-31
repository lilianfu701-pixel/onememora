"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

type Blocked = { userId: string; name: string | null };

export function BlockedList(props: {
  memorialId: string;
  initial: Blocked[];
}) {
  const t = useTranslations("memorial");
  const [list, setList] = useState<Blocked[]>(props.initial);
  const [busy, setBusy] = useState<string | null>(null);

  async function unblock(userId: string): Promise<void> {
    const previous = list;
    setBusy(userId);
    setList((current) => current.filter((b) => b.userId !== userId));
    try {
      const response = await fetch(
        `/api/memorials/${props.memorialId}/blocks/${userId}`,
        { method: "DELETE" },
      );
      if (!response.ok) setList(previous);
    } catch {
      setList(previous);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="stack">
      <h3 className="eyebrow">{t("blockedListTitle")}</h3>
      {list.length === 0 ? (
        <p className="muted">{t("blockedEmpty")}</p>
      ) : (
        <ul className="blockedList">
          {list.map((b) => (
            <li key={b.userId} className="blockedRow">
              <span className="blockedName">
                {b.name ? b.name : t("blockedUnknown")}
              </span>
              <button
                type="button"
                className="linkButton"
                disabled={busy === b.userId}
                onClick={() => unblock(b.userId)}
              >
                {t("unblock")}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

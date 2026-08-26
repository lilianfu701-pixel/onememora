"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import type { InboxMessage } from "@/modules/messaging/inbox";

export function InboxView(props: {
  locale: string;
  initial: InboxMessage[];
}) {
  const t = useTranslations("inbox");
  const common = useTranslations("common");

  const [messages, setMessages] = useState<InboxMessage[]>(props.initial);
  const [openId, setOpenId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replyState, setReplyState] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

  async function open(m: InboxMessage): Promise<void> {
    const next = openId === m.id ? null : m.id;
    setOpenId(next);
    setReplyBody("");
    setReplyState("idle");
    if (next && !m.read) {
      setMessages((cur) =>
        cur.map((x) => (x.id === m.id ? { ...x, read: true } : x)),
      );
      try {
        await fetch("/api/messages/read", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ids: [m.id] }),
        });
      } catch {
        /* the optimistic mark stands; it will reconcile on reload */
      }
    }
  }

  async function sendReply(messageId: string): Promise<void> {
    if (replyBody.trim().length === 0 || replyState === "sending") return;
    setReplyState("sending");
    try {
      const res = await fetch(`/api/messages/${messageId}/reply`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: replyBody.trim() }),
      });
      setReplyState(res.ok ? "sent" : "error");
      if (res.ok) setReplyBody("");
    } catch {
      setReplyState("error");
    }
  }

  const dateOf = (d: Date | string): string =>
    new Date(d).toLocaleDateString(props.locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  if (messages.length === 0) {
    return <p className="muted">{t("empty")}</p>;
  }

  return (
    <ul className="inboxList">
      {messages.map((m) => {
        const isOpen = openId === m.id;
        const who = m.fromSystem
          ? t("systemSender")
          : (m.senderName ?? t("someone"));
        return (
          <li
            key={m.id}
            className={`inboxItem${m.read ? "" : " inboxItemUnread"}`}
          >
            <button
              type="button"
              className="inboxItemHead"
              onClick={() => open(m)}
              aria-expanded={isOpen}
            >
              <span className="inboxItemWho">
                {!m.read ? <span className="inboxDot" aria-hidden="true" /> : null}
                {m.fromSystem ? (
                  <span className="inboxSystemTag">{who}</span>
                ) : (
                  who
                )}
              </span>
              <span className="inboxItemMeta">
                {m.subject ? (
                  <span className="inboxItemSubject">{m.subject}</span>
                ) : null}
                <span className="inboxItemDate">{dateOf(m.createdAt)}</span>
              </span>
            </button>

            {isOpen ? (
              <div className="inboxItemBody stack">
                <p className="inboxBodyText">{m.body}</p>
                {m.memorialSlug ? (
                  <p>
                    <Link
                      className="linkButton"
                      href={`/${props.locale}/memorials/${m.memorialSlug}`}
                    >
                      {t("openMemorial")} →
                    </Link>
                  </p>
                ) : null}

                {!m.fromSystem ? (
                  replyState === "sent" ? (
                    <p className="notice">{t("replySent")}</p>
                  ) : (
                    <div className="inboxReply stack">
                      <textarea
                        className="input"
                        rows={3}
                        maxLength={2000}
                        placeholder={t("replyPlaceholder")}
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                      />
                      {replyState === "error" ? (
                        <p className="fieldError" role="alert">
                          {t("replyFailed")}
                        </p>
                      ) : null}
                      <div>
                        <button
                          type="button"
                          className="button buttonPrimary buttonCompact"
                          disabled={
                            replyState === "sending" ||
                            replyBody.trim().length === 0
                          }
                          onClick={() => sendReply(m.id)}
                        >
                          {replyState === "sending"
                            ? common("loading")
                            : t("reply")}
                        </button>
                      </div>
                    </div>
                  )
                ) : null}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

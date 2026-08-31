"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

type Audience = "public" | "family" | "private";

type Story = {
  id: string;
  title: string | null;
  body: string;
  audience: Audience;
  isOwn: boolean;
  parentId: string | null;
  blockable?: boolean;
};

export function Guestbook(props: {
  memorialId: string;
  locale: string;
  initial: Story[];
  canModerate: boolean;
  isLoggedIn: boolean;
}) {
  const t = useTranslations("memorial");
  const errors = useTranslations("errors");

  const [stories, setStories] = useState<Story[]>(props.initial);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<Audience>("public");
  const [sending, setSending] = useState(false);
  const [thanked, setThanked] = useState(false);
  const [failed, setFailed] = useState(false);

  // Replies are hidden until a reader opens a thread.
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyName, setReplyName] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [replySending, setReplySending] = useState(false);

  const topLevel = useMemo(
    () => stories.filter((s) => !s.parentId),
    [stories],
  );
  const repliesByParent = useMemo(() => {
    const map = new Map<string, Story[]>();
    for (const s of stories) {
      if (!s.parentId) continue;
      const list = map.get(s.parentId) ?? [];
      list.push(s);
      map.set(s.parentId, list);
    }
    return map;
  }, [stories]);

  function audienceLabel(value: Audience): string {
    if (value === "family") return t("audienceFamily");
    if (value === "private") return t("audiencePrivate");
    return t("audiencePublic");
  }

  function toggleExpand(id: string): void {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openReply(parentId: string, quote?: string): void {
    setReplyingTo(parentId);
    setExpanded((current) => new Set(current).add(parentId));
    setReplyMessage(quote ? `「${quote}」\n` : "");
  }

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (message.trim().length === 0 || sending) return;

    setSending(true);
    setFailed(false);
    try {
      const response = await fetch(
        `/api/memorials/${props.memorialId}/stories`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: name.trim() || undefined,
            message: message.trim(),
            locale: props.locale,
            audience,
          }),
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.data?.id) {
        setFailed(true);
        return;
      }
      setStories((current) => [
        ...current,
        {
          id: payload.data.id,
          title: payload.data.title ?? null,
          body: payload.data.body,
          audience: payload.data.audience ?? "public",
          isOwn: true,
          parentId: null,
        },
      ]);
      setName("");
      setMessage("");
      setThanked(true);
    } catch {
      setFailed(true);
    } finally {
      setSending(false);
    }
  }

  async function submitReply(parentId: string): Promise<void> {
    if (replyMessage.trim().length === 0 || replySending) return;
    setReplySending(true);
    try {
      const response = await fetch(
        `/api/memorials/${props.memorialId}/stories`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: replyName.trim() || undefined,
            message: replyMessage.trim(),
            locale: props.locale,
            audience: "public",
            parentId,
          }),
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.data?.id) return;
      setStories((current) => [
        ...current,
        {
          id: payload.data.id,
          title: payload.data.title ?? null,
          body: payload.data.body,
          audience: "public",
          isOwn: true,
          parentId,
        },
      ]);
      setReplyName("");
      setReplyMessage("");
      setReplyingTo(null);
    } finally {
      setReplySending(false);
    }
  }

  async function remove(id: string): Promise<void> {
    const previous = stories;
    setStories((current) => current.filter((story) => story.id !== id));
    try {
      const response = await fetch(
        `/api/memorials/${props.memorialId}/stories/${id}`,
        { method: "DELETE" },
      );
      if (!response.ok) setStories(previous);
    } catch {
      setStories(previous);
    }
  }

  async function block(id: string): Promise<void> {
    if (!window.confirm(t("blockConfirm"))) return;
    const previous = stories;
    // The message (and any others by this person) drop out; the server hides
    // the rest, which a reload reflects fully.
    setStories((current) =>
      current.filter((story) => story.id !== id && story.parentId !== id),
    );
    try {
      const response = await fetch(
        `/api/memorials/${props.memorialId}/stories/${id}/block`,
        { method: "POST" },
      );
      if (!response.ok) setStories(previous);
    } catch {
      setStories(previous);
    }
  }

  return (
    <section className="stack">
      <h2>{t("storiesFromVisitors")}</h2>

      {topLevel.length > 0 ? (
        <div className="guestbookList">
          {topLevel.map((story) => {
            const replies = repliesByParent.get(story.id) ?? [];
            const isOpen = expanded.has(story.id);
            return (
              <div className="card stack guestbookItem" key={story.id}>
                <div className="guestbookItemHead">
                  {story.title ? <h3>{story.title}</h3> : <span />}
                  {story.audience !== "public" ? (
                    <span className="guestbookBadge">
                      {audienceLabel(story.audience)}
                    </span>
                  ) : null}
                </div>
                <p>{story.body}</p>

                <div className="guestbookActions">
                  <button
                    type="button"
                    className="linkButton"
                    onClick={() => openReply(story.id)}
                  >
                    {t("reply")}
                  </button>
                  <button
                    type="button"
                    className="linkButton"
                    onClick={() => openReply(story.id, story.body)}
                  >
                    {t("quote")}
                  </button>
                  {replies.length > 0 ? (
                    <button
                      type="button"
                      className="linkButton"
                      onClick={() => toggleExpand(story.id)}
                    >
                      {isOpen
                        ? t("hideReplies")
                        : t("replies", { count: replies.length })}
                    </button>
                  ) : null}
                  {props.canModerate ? (
                    <button
                      type="button"
                      className="linkButton guestbookRemove"
                      onClick={() => remove(story.id)}
                    >
                      {t("removeMessage")}
                    </button>
                  ) : null}
                  {props.canModerate && story.blockable ? (
                    <button
                      type="button"
                      className="linkButton guestbookBlock"
                      onClick={() => block(story.id)}
                    >
                      {t("blockUser")}
                    </button>
                  ) : null}
                </div>

                {isOpen && replies.length > 0 ? (
                  <div className="guestbookReplies">
                    {replies.map((reply) => (
                      <div className="guestbookReply" key={reply.id}>
                        {reply.title ? (
                          <span className="guestbookReplyName">
                            {reply.title}
                          </span>
                        ) : null}
                        <p>{reply.body}</p>
                        <div className="guestbookActions">
                          <button
                            type="button"
                            className="linkButton"
                            onClick={() => openReply(story.id, reply.body)}
                          >
                            {t("quote")}
                          </button>
                          {props.canModerate ? (
                            <button
                              type="button"
                              className="linkButton guestbookRemove"
                              onClick={() => remove(reply.id)}
                            >
                              {t("removeMessage")}
                            </button>
                          ) : null}
                          {props.canModerate && reply.blockable ? (
                            <button
                              type="button"
                              className="linkButton guestbookBlock"
                              onClick={() => block(reply.id)}
                            >
                              {t("blockUser")}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {replyingTo === story.id ? (
                  <div className="guestbookReplyForm stack">
                    <input
                      className="input"
                      type="text"
                      maxLength={60}
                      placeholder={t("yourNameOptional")}
                      value={replyName}
                      onChange={(e) => setReplyName(e.target.value)}
                    />
                    <textarea
                      className="input"
                      rows={3}
                      maxLength={2000}
                      placeholder={t("messagePlaceholder")}
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                    />
                    <div className="guestbookReplyFormActions">
                      <button
                        type="button"
                        className="button buttonQuiet buttonCompact"
                        onClick={() => setReplyingTo(null)}
                      >
                        {t("cancelMessage")}
                      </button>
                      <button
                        type="button"
                        className="button buttonPrimary buttonCompact"
                        disabled={
                          replySending || replyMessage.trim().length === 0
                        }
                        onClick={() => submitReply(story.id)}
                      >
                        {t("sendMessage")}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="muted">{t("noMessagesYet")}</p>
      )}

      <form className="guestbookForm card stack" onSubmit={submit}>
        <h3 className="eyebrow">{t("leaveMessage")}</h3>
        <label className="field">
          <span className="fieldLabel">{t("yourNameOptional")}</span>
          <input
            className="input"
            type="text"
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="fieldLabel">{t("leaveMessage")}</span>
          <textarea
            className="input"
            rows={4}
            maxLength={2000}
            placeholder={t("messagePlaceholder")}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setThanked(false);
            }}
          />
        </label>
        <label className="field">
          <span className="fieldLabel">{t("audienceLabel")}</span>
          <select
            className="input"
            value={audience}
            onChange={(e) => setAudience(e.target.value as Audience)}
          >
            <option value="public">{t("audiencePublic")}</option>
            <option value="family">{t("audienceFamily")}</option>
            {props.isLoggedIn ? (
              <option value="private">{t("audiencePrivate")}</option>
            ) : null}
          </select>
        </label>
        <div>
          <button
            type="submit"
            className="button buttonPrimary"
            disabled={sending || message.trim().length === 0}
          >
            {t("sendMessage")}
          </button>
        </div>
        {thanked ? <p className="notice">{t("messageThanks")}</p> : null}
        {failed ? (
          <p className="fieldError" role="alert">
            {errors("unexpected")}
          </p>
        ) : null}
      </form>
    </section>
  );
}

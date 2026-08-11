"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

type Story = { id: string; title: string | null; body: string };

export function Guestbook(props: {
  memorialId: string;
  locale: string;
  initial: Story[];
  canModerate: boolean;
}) {
  const t = useTranslations("memorial");
  const errors = useTranslations("errors");

  const [stories, setStories] = useState<Story[]>(props.initial);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [thanked, setThanked] = useState(false);
  const [failed, setFailed] = useState(false);

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

  return (
    <section className="stack">
      <h2>{t("storiesFromVisitors")}</h2>

      {stories.length > 0 ? (
        <div className="guestbookList">
          {stories.map((story) => (
            <div className="card stack guestbookItem" key={story.id}>
              {story.title ? <h3>{story.title}</h3> : null}
              <p>{story.body}</p>
              {props.canModerate ? (
                <button
                  type="button"
                  className="linkButton guestbookRemove"
                  onClick={() => remove(story.id)}
                >
                  {t("removeMessage")}
                </button>
              ) : null}
            </div>
          ))}
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

"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

/**
 * "Contact the family" — a visitor writes privately to whoever manages this
 * memorial. The message is not shown on the page; it reaches the manage view.
 */
export function ContactManager(props: { memorialId: string; label: string }) {
  const t = useTranslations("memorial");
  const common = useTranslations("common");

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [body, setBody] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  async function send(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (body.trim().length === 0 || state === "sending") return;
    setState("sending");
    try {
      const res = await fetch(
        `/api/memorials/${props.memorialId}/contact`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            body: body.trim(),
            name: name.trim() || undefined,
            contact: contact.trim() || undefined,
          }),
        },
      );
      setState(res.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        className="linkButton contactManagerLink"
        onClick={() => setOpen(true)}
      >
        {props.label}
      </button>
    );
  }

  if (state === "sent") {
    return <span className="contactSent">{t("contactSent")}</span>;
  }

  return (
    <form className="contactForm card stack" onSubmit={send}>
      <label className="field">
        <span className="fieldLabel">{t("contactBodyLabel")}</span>
        <textarea
          className="input"
          rows={4}
          maxLength={2000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </label>
      <div className="contactFormRow">
        <label className="field">
          <span className="fieldLabel">{t("contactNameLabel")}</span>
          <input
            className="input"
            type="text"
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="fieldLabel">{t("contactReachLabel")}</span>
          <input
            className="input"
            type="text"
            maxLength={120}
            placeholder={t("contactReachHint")}
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
        </label>
      </div>
      {state === "error" ? (
        <p className="fieldError" role="alert">
          {t("contactFailed")}
        </p>
      ) : null}
      <div className="contactFormActions">
        <button
          type="button"
          className="button buttonQuiet buttonCompact"
          onClick={() => setOpen(false)}
        >
          {common("cancel")}
        </button>
        <button
          type="submit"
          className="button buttonPrimary buttonCompact"
          disabled={state === "sending" || body.trim().length === 0}
        >
          {state === "sending" ? common("loading") : t("contactSend")}
        </button>
      </div>
    </form>
  );
}

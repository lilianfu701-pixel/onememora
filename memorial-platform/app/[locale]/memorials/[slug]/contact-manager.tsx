"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";

/**
 * "Contact the family" — a signed-in visitor writes privately to whoever
 * manages this memorial. The message lands in the managers' inboxes; a reply
 * routes back through the system, so no contact details are exchanged.
 */
export function ContactManager(props: {
  memorialId: string;
  label: string;
  signedIn: boolean;
  signInHref: string;
}) {
  const t = useTranslations("memorial");
  const common = useTranslations("common");

  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  if (!props.signedIn) {
    return (
      <Link className="linkButton contactManagerLink" href={props.signInHref}>
        {props.label}
      </Link>
    );
  }

  async function send(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (body.trim().length === 0 || state === "sending") return;
    setState("sending");
    try {
      const res = await fetch(`/api/memorials/${props.memorialId}/contact`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      });
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
      <p className="muted contactHint">{t("contactHint")}</p>
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

"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";

/**
 * A signed-in user writes to the platform team. The message goes to the admins'
 * inboxes and they reply there — no email, no contact details exchanged.
 */
export function ContactForm(props: { signedIn: boolean; signInHref: string }) {
  const t = useTranslations("support");
  const common = useTranslations("common");

  const [body, setBody] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  if (!props.signedIn) {
    return (
      <Link className="button buttonPrimary" href={props.signInHref}>
        {t("signInPrompt")}
      </Link>
    );
  }

  if (state === "sent") {
    return <p className="contactSent">{t("sent")}</p>;
  }

  async function send(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (body.trim().length === 0 || state === "sending") return;
    setState("sending");
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      });
      if (res.ok) {
        setBody("");
        setState("sent");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  return (
    <form className="contactForm card stack" onSubmit={send}>
      <label className="field">
        <span className="fieldLabel">{t("bodyLabel")}</span>
        <textarea
          className="input"
          rows={6}
          maxLength={2000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t("placeholder")}
        />
      </label>
      {state === "error" ? (
        <p className="fieldError" role="alert">
          {t("error")}
        </p>
      ) : null}
      <button
        type="submit"
        className="button buttonPrimary"
        disabled={state === "sending" || body.trim().length === 0}
      >
        {state === "sending" ? common("loading") : t("send")}
      </button>
    </form>
  );
}

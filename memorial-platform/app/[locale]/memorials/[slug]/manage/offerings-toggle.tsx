"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

/** The offerings a family can switch on or off, in altar order. */
const SLUGS = ["incense", "candle", "wreath", "donation"] as const;

/**
 * Per-memorial on/off switches for each offering. Everything is on by default;
 * turning one off hides its button on the page and refuses it server-side, and
 * the page tells visitors the family has closed it.
 */
export function OfferingsToggle(props: {
  memorialId: string;
  disabled: readonly string[];
}) {
  const t = useTranslations("offerings");
  const [disabled, setDisabled] = useState<string[]>([...props.disabled]);
  const [saving, setSaving] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  async function toggle(slug: string): Promise<void> {
    const next = disabled.includes(slug)
      ? disabled.filter((s) => s !== slug)
      : [...disabled, slug];
    const previous = disabled;
    setDisabled(next);
    setSaving(slug);
    setFailed(false);
    try {
      const res = await fetch(
        `/api/memorials/${props.memorialId}/offering-settings`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ disabled: next }),
        },
      );
      if (!res.ok) {
        setDisabled(previous);
        setFailed(true);
      }
    } catch {
      setDisabled(previous);
      setFailed(true);
    } finally {
      setSaving(null);
    }
  }

  return (
    <section className="stack offeringsToggle">
      <h2>{t("manageTitle")}</h2>
      <p className="muted">{t("manageHelp")}</p>
      <ul className="offeringsToggleList">
        {SLUGS.map((slug) => (
          <li key={slug} className="offeringsToggleRow">
            <label>
              <input
                type="checkbox"
                checked={!disabled.includes(slug)}
                onChange={() => toggle(slug)}
                disabled={saving === slug}
              />
              <span>{t(`slug_${slug}`)}</span>
            </label>
            <span className="offeringsToggleState muted">
              {disabled.includes(slug) ? t("stateOff") : t("stateOn")}
            </span>
          </li>
        ))}
      </ul>
      {failed ? <p className="formError">{t("manageFailed")}</p> : null}
    </section>
  );
}

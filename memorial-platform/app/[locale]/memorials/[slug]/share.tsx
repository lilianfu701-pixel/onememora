"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

function shareTo(
  platform: string,
  url: string,
  title: string,
): void {
  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const targets: Record<string, string> = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
    twitter: `https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encoded}`,
    telegram: `https://t.me/share/url?url=${encoded}&text=${encodedTitle}`,
    line: `https://social-plugins.line.me/lineit/share?url=${encoded}`,
    email: `mailto:?subject=${encodedTitle}&body=${encoded}`,
  };
  const target = targets[platform];
  if (target) {
    window.open(target, "_blank", "noopener,noreferrer");
  }
}

export function Share(props: { url: string; title: string }) {
  const t = useTranslations("memorial");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasNativeShare, setHasNativeShare] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHasNativeShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open, handleClickOutside]);

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(props.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  }

  async function nativeShare(): Promise<void> {
    try {
      await navigator.share({ title: props.title, url: props.url });
    } catch {
      /* dismissed */
    }
  }

  return (
    <div className="shareWrap" ref={wrapRef}>
      <button
        type="button"
        className="button buttonQuiet buttonCompact"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {t("share")}
      </button>

      {open ? (
        <div className="sharePanel card stack">
          <div className="shareQr">
            <QRCodeSVG value={props.url} size={168} marginSize={2} />
          </div>
          <p className="muted shareScanHint">{t("scanToOpen")}</p>

          <div className="shareLinkRow">
            <input
              className="input"
              type="text"
              readOnly
              value={props.url}
              onFocus={(event) => event.target.select()}
            />
            <button
              type="button"
              className="button buttonPrimary buttonCompact"
              onClick={copy}
            >
              {copied ? t("linkCopied") : t("copyLink")}
            </button>
          </div>

          <div className="sharePlatforms">
            <button
              type="button"
              className="sharePlatformBtn"
              onClick={() => shareTo("whatsapp", props.url, props.title)}
              aria-label="WhatsApp"
            >
              <span aria-hidden="true">💬</span>
            </button>
            <button
              type="button"
              className="sharePlatformBtn"
              onClick={() => shareTo("facebook", props.url, props.title)}
              aria-label="Facebook"
            >
              <span aria-hidden="true">📘</span>
            </button>
            <button
              type="button"
              className="sharePlatformBtn"
              onClick={() => shareTo("twitter", props.url, props.title)}
              aria-label="X / Twitter"
            >
              <span aria-hidden="true">🐦</span>
            </button>
            <button
              type="button"
              className="sharePlatformBtn"
              onClick={() => shareTo("telegram", props.url, props.title)}
              aria-label="Telegram"
            >
              <span aria-hidden="true">✈️</span>
            </button>
            <button
              type="button"
              className="sharePlatformBtn"
              onClick={() => shareTo("line", props.url, props.title)}
              aria-label="LINE"
            >
              <span aria-hidden="true">🟢</span>
            </button>
            <button
              type="button"
              className="sharePlatformBtn"
              onClick={() => shareTo("email", props.url, props.title)}
              aria-label="Email"
            >
              <span aria-hidden="true">✉️</span>
            </button>
          </div>

          {hasNativeShare ? (
            <button
              type="button"
              className="button buttonQuiet buttonCompact shareNativeBtn"
              onClick={nativeShare}
            >
              {t("shareMore")}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

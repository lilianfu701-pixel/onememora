"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export function Share(props: { url: string; title: string }) {
  const t = useTranslations("memorial");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasNativeShare, setHasNativeShare] = useState(false);

  useEffect(() => {
    setHasNativeShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(props.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the link stays selectable in the field */
    }
  }

  async function nativeShare(): Promise<void> {
    try {
      await navigator.share({ title: props.title, url: props.url });
    } catch {
      /* the visitor dismissed the share sheet */
    }
  }

  return (
    <div className="shareWrap">
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

          {hasNativeShare ? (
            <div>
              <button
                type="button"
                className="button buttonQuiet buttonCompact"
                onClick={nativeShare}
              >
                {t("share")}…
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

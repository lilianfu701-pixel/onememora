"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  drawObituaryPoster,
  POSTER_W,
  POSTER_H,
} from "./obituary-poster";
import type { PosterInput } from "./obituary-poster";

export type PosterData = PosterInput;

export function ObituaryShare(props: {
  memorialUrl: string;
  shareText: string;
  poster: PosterData;
}) {
  const t = useTranslations("memorial");
  const qrRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  async function copyText(): Promise<void> {
    try {
      await navigator.clipboard.writeText(props.shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the text is still selectable on the page */
    }
  }

  async function sharePoster(): Promise<void> {
    setBusy(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = POSTER_W;
      canvas.height = POSTER_H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const qr = qrRef.current?.querySelector("canvas");
      await drawObituaryPoster(ctx, props.poster, qr ?? null);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) return;

      const fileName = `讣告-${props.poster.name}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      // On a phone the native share sheet takes the image straight into WeChat,
      // Moments, etc. — one step, no download. Elsewhere, fall back to a save.
      const nav = navigator as Navigator & {
        canShare?: (data: { files: File[] }) => boolean;
      };
      if (nav.canShare?.({ files: [file] }) && navigator.share) {
        try {
          await navigator.share({ files: [file], title: props.poster.name });
          return;
        } catch {
          /* user dismissed, or share failed — fall through to download */
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="obituaryShare">
      <button
        type="button"
        className="button buttonPrimary"
        onClick={sharePoster}
        disabled={busy}
      >
        {busy ? t("obituaryPosterBusy") : t("obituaryPoster")}
      </button>
      <button type="button" className="button buttonQuiet" onClick={copyText}>
        {copied ? t("obituaryCopied") : t("obituaryCopyText")}
      </button>

      {/* Hidden QR, drawn into the poster's white box. */}
      <div ref={qrRef} style={{ position: "absolute", left: -9999, top: -9999 }}>
        <QRCodeCanvas value={props.memorialUrl} size={300} level="M" />
      </div>
    </div>
  );
}

"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { drawObituaryPoster, POSTER_W, POSTER_H } from "./obituary-poster";
import type { PosterInput } from "./obituary-poster";

export type PosterData = PosterInput;

/**
 * Shown right after publishing: the finished poster is rendered on screen, with
 * the actions beneath it — download / share the image, share or copy the link,
 * copy the full text, and open the memorial.
 */
export function ObituaryShare(props: {
  memorialUrl: string;
  shareText: string;
  poster: PosterData;
}) {
  const t = useTranslations("memorial");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [canShareFiles, setCanShareFiles] = useState(false);

  // Draw the poster onto the visible canvas once, after the QR has mounted.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const qr = qrRef.current?.querySelector("canvas");
    let cancelled = false;
    void drawObituaryPoster(ctx, props.poster, qr ?? null).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [props.poster]);

  useEffect(() => {
    const file = new File([new Blob()], "x.png", { type: "image/png" });
    const nav = navigator as Navigator & {
      canShare?: (data: { files: File[] }) => boolean;
    };
    setCanShareFiles(Boolean(nav.canShare?.({ files: [file] }) && navigator.share));
  }, []);

  async function posterBlob(): Promise<Blob | null> {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  }

  async function downloadPoster(): Promise<void> {
    const blob = await posterBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `讣告-${props.poster.name}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function sharePoster(): Promise<void> {
    const blob = await posterBlob();
    if (!blob) return;
    const file = new File([blob], `讣告-${props.poster.name}.png`, {
      type: "image/png",
    });
    try {
      await navigator.share({ files: [file], title: props.poster.name });
    } catch {
      /* dismissed */
    }
  }

  async function shareLink(): Promise<void> {
    if (navigator.share) {
      try {
        await navigator.share({
          title: props.poster.name,
          url: props.memorialUrl,
        });
        return;
      } catch {
        /* dismissed — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(props.memorialUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  }

  async function copyText(): Promise<void> {
    try {
      await navigator.clipboard.writeText(props.shareText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <div className="obituaryShare stack">
      <div className="obituaryPosterFrame">
        <canvas
          ref={canvasRef}
          width={POSTER_W}
          height={POSTER_H}
          className="obituaryPosterCanvas"
          role="img"
          aria-label={props.poster.name}
        />
        {!ready ? (
          <p className="muted obituaryPosterLoading">{t("obituaryPosterBusy")}</p>
        ) : null}
      </div>

      <div className="obituaryActions">
        <button
          type="button"
          className="button buttonPrimary buttonCompact"
          onClick={downloadPoster}
          disabled={!ready}
        >
          {t("obituaryDownloadPoster")}
        </button>
        {canShareFiles ? (
          <button
            type="button"
            className="button buttonQuiet buttonCompact"
            onClick={sharePoster}
            disabled={!ready}
          >
            {t("obituarySharePoster")}
          </button>
        ) : null}
        <button
          type="button"
          className="button buttonQuiet buttonCompact"
          onClick={shareLink}
        >
          {copiedLink ? t("linkCopied") : t("obituaryShareLink")}
        </button>
        <button
          type="button"
          className="button buttonQuiet buttonCompact"
          onClick={copyText}
        >
          {copiedText ? t("obituaryCopied") : t("obituaryCopyText")}
        </button>
        <Link
          className="button buttonQuiet buttonCompact"
          href={props.memorialUrl}
        >
          {t("obituaryEnterMemorial")}
        </Link>
      </div>

      {/* Hidden QR, drawn into the poster's white box. */}
      <div ref={qrRef} style={{ position: "absolute", left: -9999, top: -9999 }}>
        <QRCodeCanvas value={props.memorialUrl} size={300} level="M" />
      </div>
    </div>
  );
}

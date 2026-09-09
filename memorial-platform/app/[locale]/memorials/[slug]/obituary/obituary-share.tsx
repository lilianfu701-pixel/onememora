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
  /** Where "进入追思页" goes — the manage page for a manager, else the memorial. */
  enterHref: string;
  shareText: string;
  poster: PosterData;
}) {
  const t = useTranslations("memorial");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPoster, setCopiedPoster] = useState(false);
  const [canShareFiles, setCanShareFiles] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

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
    // Only offer file-sharing on a touch device (phone/tablet), where the OS
    // share sheet actually lists WeChat, Moments, etc. On desktop it opens a
    // near-empty Windows share panel ("我们无法为你显示所有共享方法"), so there
    // the 下载海报 button is the right path instead.
    const isTouch =
      typeof navigator !== "undefined" &&
      (navigator.maxTouchPoints > 0 ||
        (typeof window !== "undefined" &&
          window.matchMedia?.("(pointer: coarse)").matches));
    const nativeShare =
      typeof navigator.share === "function" && Boolean(isTouch);
    setCanNativeShare(nativeShare);
    setCanShareFiles(
      Boolean(nav.canShare?.({ files: [file] }) && nativeShare),
    );
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
    const fileName = `讣告-${props.poster.name}.png`;

    // Phone/tablet: the OS share sheet takes the image into WeChat, Moments, etc.
    if (canShareFiles) {
      try {
        await navigator.share({
          files: [new File([blob], fileName, { type: "image/png" })],
          title: props.poster.name,
        });
      } catch {
        /* dismissed */
      }
      return;
    }

    // Desktop: copy the image to the clipboard so it can be pasted straight into
    // WeChat / QQ desktop — no empty Windows share panel.
    try {
      const clip = navigator.clipboard as Clipboard & {
        write?: (items: ClipboardItem[]) => Promise<void>;
      };
      if (typeof ClipboardItem !== "undefined" && clip?.write) {
        await clip.write([new ClipboardItem({ "image/png": blob })]);
        setCopiedPoster(true);
        setTimeout(() => setCopiedPoster(false), 2000);
        return;
      }
    } catch {
      /* clipboard image unsupported — fall back to a download */
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function shareLink(): Promise<void> {
    // System share only on a phone/tablet; on desktop it is a near-empty Windows
    // panel, so just copy the link there.
    if (canNativeShare) {
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
        <button
          type="button"
          className="button buttonQuiet buttonCompact"
          onClick={sharePoster}
          disabled={!ready}
        >
          {copiedPoster ? t("obituaryCopied") : t("obituarySharePoster")}
        </button>
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
          href={props.enterHref}
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

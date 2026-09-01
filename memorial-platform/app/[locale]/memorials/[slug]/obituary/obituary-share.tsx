"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

export type PosterData = {
  name: string;
  dates: string;
  nativePlace: string | null;
  body: string;
  service: string | null;
  survivors: string | null;
  /** Only same-origin URLs can be drawn without tainting the canvas. */
  portraitUrl: string | null;
};

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

  function wrap(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
  ): string[] {
    const lines: string[] = [];
    for (const paragraph of text.split(/\n+/)) {
      let line = "";
      for (const ch of paragraph) {
        if (ctx.measureText(line + ch).width > maxWidth && line) {
          lines.push(line);
          line = ch;
        } else {
          line += ch;
        }
      }
      lines.push(line);
    }
    return lines;
  }

  async function makePoster(): Promise<void> {
    setBusy(true);
    try {
      const W = 800;
      const H = 1200;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Ground and border.
      ctx.fillStyle = "#faf7f0";
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "#c5a35f";
      ctx.lineWidth = 3;
      ctx.strokeRect(24, 24, W - 48, H - 48);

      const serif =
        '"Songti SC", "Noto Serif SC", "SimSun", Georgia, serif';
      ctx.textAlign = "center";
      ctx.fillStyle = "#2a2320";

      // Title.
      ctx.font = `bold 76px ${serif}`;
      ctx.fillText(t("obituaryTitle"), W / 2, 130);

      let y = 190;

      // Portrait, when it is a same-origin image (else skipped, no taint).
      if (props.poster.portraitUrl) {
        try {
          const img = await loadImage(props.poster.portraitUrl);
          const pw = 240;
          const ph = 300;
          const px = (W - pw) / 2;
          ctx.strokeStyle = "#8a8079";
          ctx.lineWidth = 2;
          ctx.drawImage(img, px, y, pw, ph);
          ctx.strokeRect(px, y, pw, ph);
          y += ph + 36;
        } catch {
          y += 12;
        }
      }

      // Name + dates + native place.
      ctx.fillStyle = "#2a2320";
      ctx.font = `bold 52px ${serif}`;
      ctx.fillText(props.poster.name, W / 2, y);
      y += 48;
      ctx.font = `28px ${serif}`;
      ctx.fillStyle = "#6b625b";
      if (props.poster.dates) {
        ctx.fillText(props.poster.dates, W / 2, y);
        y += 40;
      }
      if (props.poster.nativePlace) {
        ctx.fillText(t("obituaryNativePrefix") + props.poster.nativePlace, W / 2, y);
        y += 40;
      }

      y += 20;
      // Body, left-aligned and wrapped.
      ctx.textAlign = "left";
      ctx.fillStyle = "#2a2320";
      ctx.font = `28px ${serif}`;
      const margin = 80;
      const maxW = W - margin * 2;
      for (const line of wrap(ctx, props.poster.body, maxW)) {
        ctx.fillText(line, margin, y);
        y += 44;
      }

      // Service.
      if (props.poster.service) {
        y += 16;
        ctx.fillStyle = "#6b625b";
        ctx.font = `26px ${serif}`;
        for (const line of wrap(ctx, props.poster.service, maxW)) {
          ctx.fillText(line, margin, y);
          y += 40;
        }
      }

      // Survivors, right-aligned.
      if (props.poster.survivors) {
        y += 20;
        ctx.textAlign = "right";
        ctx.fillStyle = "#2a2320";
        ctx.font = `28px ${serif}`;
        ctx.fillText(props.poster.survivors, W - margin, y);
        y += 44;
      }

      // QR + prompt at the foot.
      const qrCanvas = qrRef.current?.querySelector("canvas");
      const qrSize = 150;
      const qrX = W - margin - qrSize;
      const qrY = H - 90 - qrSize;
      if (qrCanvas) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16);
        ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);
      }
      ctx.textAlign = "left";
      ctx.fillStyle = "#6b625b";
      ctx.font = `24px ${serif}`;
      ctx.fillText(t("obituaryScanHint"), margin, qrY + qrSize / 2);
      ctx.fillText("missingu.org", margin, qrY + qrSize / 2 + 34);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `讣告-${props.poster.name}.png`;
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
      <button type="button" className="button buttonPrimary" onClick={copyText}>
        {copied ? t("obituaryCopied") : t("obituaryCopyText")}
      </button>
      <button
        type="button"
        className="button buttonQuiet"
        onClick={makePoster}
        disabled={busy}
      >
        {busy ? t("obituaryPosterBusy") : t("obituaryPoster")}
      </button>

      {/* Hidden QR, drawn onto the poster canvas. */}
      <div ref={qrRef} style={{ position: "absolute", left: -9999, top: -9999 }}>
        <QRCodeCanvas value={props.memorialUrl} size={300} level="M" />
      </div>
    </div>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

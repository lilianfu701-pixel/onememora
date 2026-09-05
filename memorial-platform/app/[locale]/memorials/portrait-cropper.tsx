"use client";

import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";

/** The 遗像 frame is a tall 3:4.5 portrait; the crop and output match it so any
 * uploaded photo ends up the same size and proportion. */
const ASPECT = 3 / 4.5;
const OUT_WIDTH = 480;
const OUT_HEIGHT = 720;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image load failed"));
    image.src = src;
  });
}

/** Draws the chosen region onto a fixed-size canvas and returns a WebP blob. */
async function cropToBlob(src: string, area: Area): Promise<Blob> {
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = OUT_WIDTH;
  canvas.height = OUT_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas context");
  ctx.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    OUT_WIDTH,
    OUT_HEIGHT,
  );
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/webp",
      0.9,
    );
  });
}

/**
 * A drag-to-pan, slider-to-zoom cropper on a fixed portrait frame. Whatever the
 * source photo's size, the result is a 480×720 WebP that fits the 遗像 frame.
 */
export function PortraitCropper(props: {
  src: string;
  onDone: (blob: Blob) => void;
  onCancel: () => void;
}) {
  const t = useTranslations("memorial");
  const common = useTranslations("common");

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setArea(pixels);
  }, []);

  async function confirm(): Promise<void> {
    if (!area || busy) return;
    setBusy(true);
    try {
      const blob = await cropToBlob(props.src, area);
      props.onDone(blob);
    } catch {
      setBusy(false);
    }
  }

  return (
    <div className="cropperOverlay" role="dialog" aria-modal="true">
      <div className="cropperBox">
        <p className="cropperTitle">{t("portraitCropTitle")}</p>
        <div className="cropperStage">
          <Cropper
            image={props.src}
            crop={crop}
            zoom={zoom}
            aspect={ASPECT}
            minZoom={1}
            maxZoom={4}
            restrictPosition
            showGrid={false}
            objectFit="cover"
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <label className="cropperZoom">
          <span className="fieldLabel">{t("portraitZoom")}</span>
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
        </label>
        <p className="muted cropperHint">{t("portraitCropHint")}</p>
        <div className="cropperActions">
          <button
            type="button"
            className="button buttonQuiet buttonCompact"
            onClick={props.onCancel}
            disabled={busy}
          >
            {common("cancel")}
          </button>
          <button
            type="button"
            className="button buttonPrimary buttonCompact"
            onClick={confirm}
            disabled={busy || !area}
          >
            {busy ? common("loading") : t("portraitConfirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

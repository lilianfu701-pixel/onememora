// Draws the 讣告 poster by overlaying dynamic content onto the black-gold
// template (public/obituary/template-zh.png, 1024×1536). The template carries
// only the fixed art and section labels (讣告 / 讣告正文 / 治丧信息 / 家属署名 /
// QR / 搜索); everything else — name, honorific, dates, 享年, the body and the
// section contents — is drawn here. Coordinates are in the 1024×1536 authoring
// space and scaled to the template's real pixels at render time.

export type PosterInput = {
  name: string;
  birth: string | null;
  death: string | null;
  /** 享年 digits only; drawn as "享年 N 岁". */
  age: string | null;
  /** male → 先生, female → 女士, null → no honorific. */
  gender: "male" | "female" | null;
  body: string;
  service: string | null;
  survivors: string | null;
  /** Same-origin/data URL only (a signed cross-origin URL taints the canvas). */
  portraitUrl: string | null;
  number: string | null;
};

export const POSTER_W = 1024;
export const POSTER_H = 1536;
// Bump the version when the template art changes, so browsers and the CDN fetch
// the new file instead of a cached copy at the same path.
const TEMPLATE_SRC = "/obituary/template-zh.png?v=2";

const SERIF =
  '"Noto Serif SC", "Songti SC", "STSong", "SimSun", "Source Han Serif SC", serif';
const WHITE = "#f5f1e8";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function measure(
  ctx: CanvasRenderingContext2D,
  text: string,
  px: number,
  weight: string,
): number {
  ctx.font = `${weight} ${px}px ${SERIF}`;
  return ctx.measureText(text).width;
}

/** Wrap text (respecting explicit newlines) to lines no wider than maxW. */
function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxW: number,
): string[] {
  const out: string[] = [];
  for (const para of text.split(/\n+/)) {
    let line = "";
    for (const ch of para) {
      if (ctx.measureText(line + ch).width > maxW && line) {
        out.push(line);
        line = ch;
      } else {
        line += ch;
      }
    }
    out.push(line);
  }
  return out;
}

export async function drawObituaryPoster(
  ctx: CanvasRenderingContext2D,
  data: PosterInput,
  qr: HTMLCanvasElement | HTMLImageElement | null,
): Promise<void> {
  const template = await loadImage(TEMPLATE_SRC);
  const natW = template.naturalWidth || POSTER_W;
  const natH = template.naturalHeight || POSTER_H;
  ctx.canvas.width = natW;
  ctx.canvas.height = natH;
  ctx.setTransform(natW / POSTER_W, 0, 0, natH / POSTER_H, 0, 0);
  ctx.drawImage(template, 0, 0, POSTER_W, POSTER_H);

  // Portrait — cover-fit into the gold frame's inner opening.
  if (data.portraitUrl) {
    try {
      const img = await loadImage(data.portraitUrl);
      const box = { x: 66, y: 46, w: 384, h: 466 };
      const scale = Math.max(box.w / img.width, box.h / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.save();
      ctx.beginPath();
      ctx.rect(box.x, box.y, box.w, box.h);
      ctx.clip();
      ctx.drawImage(
        img,
        box.x + (box.w - dw) / 2,
        box.y + (box.h - dh) / 2,
        dw,
        dh,
      );
      ctx.restore();
    } catch {
      /* leave the placeholder silhouette */
    }
  }

  ctx.fillStyle = WHITE;

  // Name + honorific, centred in the right column beneath the 讣告 title.
  const RIGHT_CX = 740;
  {
    const hon = data.gender
      ? data.gender === "male"
        ? "先生"
        : "女士"
      : "";
    let namePx = 58;
    const honPx = 34;
    const gap = 14;
    // Shrink the name until the whole name+honorific group fits the column.
    const maxW = 470;
    let nameW = measure(ctx, data.name, namePx, "700");
    let honW = hon ? measure(ctx, hon, honPx, "600") + gap : 0;
    while (nameW + honW > maxW && namePx > 30) {
      namePx -= 2;
      nameW = measure(ctx, data.name, namePx, "700");
    }
    const total = nameW + honW;
    const x = RIGHT_CX - total / 2;
    const baseline = 356;
    ctx.textAlign = "left";
    ctx.fillStyle = WHITE;
    ctx.font = `700 ${namePx}px ${SERIF}`;
    ctx.fillText(data.name, x, baseline);
    if (hon) {
      ctx.font = `600 ${honPx}px ${SERIF}`;
      ctx.fillText(hon, x + nameW + gap, baseline);
    }
  }

  ctx.textAlign = "center";
  ctx.fillStyle = WHITE;

  // Dates.
  const life =
    data.birth && data.death
      ? `${data.birth} — ${data.death}`
      : data.birth || data.death || "";
  if (life) {
    ctx.font = `400 34px ${SERIF}`;
    ctx.fillText(life, RIGHT_CX, 410);
  }

  // 享年.
  if (data.age) {
    ctx.font = `400 34px ${SERIF}`;
    ctx.fillText(`享年 ${data.age} 岁`, RIGHT_CX, 466);
  }

  // Body — beneath the 讣告正文 label, full width.
  ctx.textAlign = "left";
  ctx.fillStyle = WHITE;
  ctx.font = `400 34px ${SERIF}`;
  {
    let y = 672;
    for (const line of wrapLines(ctx, data.body, 915)) {
      if (y > 905) break;
      ctx.fillText(line, 60, y);
      y += 46;
    }
  }

  // 治丧信息 content — to the right of the candle icon + label row.
  if (data.service) {
    ctx.font = `400 30px ${SERIF}`;
    let y = 992;
    for (const line of wrapLines(ctx, data.service, 820)) {
      if (y > 1055) break;
      ctx.fillText(line, 150, y);
      y += 42;
    }
  }

  // 家属署名 content — clear of the candle photo, to the right.
  if (data.survivors) {
    ctx.font = `400 30px ${SERIF}`;
    let y = 1155;
    for (const line of wrapLines(ctx, data.survivors, 560)) {
      if (y > 1252) break;
      ctx.fillText(line, 415, y);
      y += 42;
    }
  }

  // QR into the white box (template box ≈ x555–758, y1273–1472).
  if (qr) {
    ctx.drawImage(qr, 562, 1270, 184, 184);
  }

  // Public number after the 搜索 label.
  if (data.number) {
    ctx.fillStyle = WHITE;
    ctx.textAlign = "left";
    ctx.font = `600 30px ${SERIF}`;
    ctx.fillText(data.number, 862, 1478);
  }
}

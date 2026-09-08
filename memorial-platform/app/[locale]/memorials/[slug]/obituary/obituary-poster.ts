// Draws the 讣告 poster by overlaying dynamic content onto the fixed black-gold
// template (public/obituary/template-zh.png, 1024×1536). Every slot coordinate
// is expressed in that 1024×1536 space; the template art is authoritative, this
// module only fills the blanks.

export type PosterInput = {
  name: string;
  birth: string | null;
  death: string | null;
  /** 享年 digits only (the template prints "享年 ___ 岁"). */
  age: string | null;
  /** male → 先生, female → 女士, null → leave the template's "先生 / 女士". */
  gender: "male" | "female" | null;
  body: string;
  service: string | null;
  survivors: string | null;
  /** Same-origin URL only (else the canvas taints and export fails). */
  portraitUrl: string | null;
  number: string | null;
};

// Slot coordinates are authored in this reference space; the renderer scales
// them to the template image's real pixel size, so dropping in a higher-res
// template (e.g. 2048×3072) sharpens everything with no code change.
export const POSTER_W = 1024;
export const POSTER_H = 1536;
const TEMPLATE_SRC = "/obituary/template-zh.png";

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

/** Draw `text` centred at cx, shrinking the font until it fits maxW. */
function fitCenter(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  baseline: number,
  maxW: number,
  startPx: number,
  weight = "700",
): void {
  let px = startPx;
  ctx.textAlign = "center";
  do {
    ctx.font = `${weight} ${px}px ${SERIF}`;
    if (ctx.measureText(text).width <= maxW || px <= 18) break;
    px -= 2;
  } while (true);
  ctx.fillText(text, cx, baseline);
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

/**
 * Renders the poster onto `ctx` (which must be a 1024×1536 context). `qr` is a
 * pre-rendered QR canvas/image (drawn into the template's white box); pass null
 * to leave it blank.
 */
export async function drawObituaryPoster(
  ctx: CanvasRenderingContext2D,
  data: PosterInput,
  qr: HTMLCanvasElement | HTMLImageElement | null,
): Promise<void> {
  const template = await loadImage(TEMPLATE_SRC);
  // Match the canvas to the template's real pixels, then scale the coordinate
  // system back to the 1024×1536 authoring space so every slot lands correctly
  // at whatever resolution the template ships at.
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
      const box = { x: 62, y: 46, w: 344, h: 456 };
      const scale = Math.max(box.w / img.width, box.h / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = box.x + (box.w - dw) / 2;
      const dy = box.y + (box.h - dh) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(box.x, box.y, box.w, box.h);
      ctx.clip();
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();
    } catch {
      /* leave the placeholder silhouette */
    }
  }

  ctx.fillStyle = WHITE;

  // Name — on the underline left of "先生 / 女士".
  fitCenter(ctx, data.name, 617, 372, 330, 56);

  // Honorific — keep only the one matching gender by painting over the printed
  // "先生 / 女士" (solid black ground) and redrawing a single word.
  if (data.gender) {
    ctx.fillStyle = "#000000";
    ctx.fillRect(793, 344, 200, 66);
    ctx.fillStyle = WHITE;
    ctx.textAlign = "left";
    ctx.font = `600 42px ${SERIF}`;
    ctx.fillText(data.gender === "male" ? "先生" : "女士", 800, 392);
    ctx.fillStyle = WHITE;
  }

  // Birth / death — one on each gold line, either side of the dash.
  ctx.font = `400 30px ${SERIF}`;
  ctx.textAlign = "center";
  if (data.birth) ctx.fillText(data.birth, 554, 438);
  if (data.death) ctx.fillText(data.death, 845, 438);

  // 享年 — the number only, on the blank between 享年 and 岁.
  if (data.age) {
    ctx.font = `400 34px ${SERIF}`;
    ctx.fillText(data.age, 732, 497);
  }

  // Body — inside the big gold box, left-aligned and wrapped.
  ctx.textAlign = "left";
  ctx.font = `400 30px ${SERIF}`;
  {
    let y = 612;
    for (const line of wrapLines(ctx, data.body, 864)) {
      if (y > 852) break;
      ctx.fillText(line, 82, y);
      y += 46;
    }
  }

  // Funeral info (治丧信息) box.
  if (data.service) {
    ctx.font = `400 26px ${SERIF}`;
    let y = 918;
    for (const line of wrapLines(ctx, data.service, 632)) {
      if (y > 978) break;
      ctx.fillText(line, 322, y);
      y += 38;
    }
  }

  // Family signatures (家属署名) box.
  if (data.survivors) {
    ctx.font = `400 26px ${SERIF}`;
    let y = 1044;
    for (const line of wrapLines(ctx, data.survivors, 632)) {
      if (y > 1104) break;
      ctx.fillText(line, 322, y);
      y += 38;
    }
  }

  // QR into the white box (with a little inset).
  if (qr) {
    ctx.drawImage(qr, 520, 1236, 206, 206);
  }

  // Public number in the 搜索 box.
  if (data.number) {
    ctx.fillStyle = WHITE;
    ctx.textAlign = "center";
    ctx.font = `600 30px ${SERIF}`;
    ctx.fillText(data.number, 908, 1503);
  }
}

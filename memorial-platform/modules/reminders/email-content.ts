/**
 * Localised reminder-email content for the three occasions. Death anniversaries
 * go to a family in their own language; the festivals target Chinese users, so
 * en/zh-CN/zh-TW cover the audience (zh-HK uses the Traditional copy, everything
 * else falls back to English).
 */

export type ReminderOccasion = "death" | "qingming" | "zhongyuan";

export interface ReminderParams {
  /** The deceased's name (death anniversary only). */
  name?: string;
  /** The occasion's date, already formatted for the locale. */
  dateText: string;
  /** Where the button goes (the memorial, or "my memorials"). */
  url: string;
  /** One-click unsubscribe. */
  unsubscribeUrl: string;
}

type Copy = {
  subject: string;
  heading: string;
  body: string;
  button: string;
};

function pick(locale: string): "zh-CN" | "zh-TW" | "en" {
  if (locale === "zh-CN") return "zh-CN";
  if (locale === "zh-TW" || locale === "zh-HK") return "zh-TW";
  return "en";
}

function copyFor(
  occasion: ReminderOccasion,
  locale: string,
  p: ReminderParams,
): Copy {
  const l = pick(locale);
  const name = p.name ?? "";
  const d = p.dateText;

  if (occasion === "death") {
    const table: Record<string, Copy> = {
      "zh-CN": {
        subject: `【追思提醒】${name} 的祭日将至`,
        heading: `${name} 的祭日将至`,
        body: `${name} 的祭日是 ${d}。愿在这一天，为思念的人点一炷心香、写一句想说的话。`,
        button: "前往追思页",
      },
      "zh-TW": {
        subject: `【追思提醒】${name} 的祭日將至`,
        heading: `${name} 的祭日將至`,
        body: `${name} 的祭日是 ${d}。願在這一天，為思念的人點一炷心香、寫一句想說的話。`,
        button: "前往追思頁",
      },
      en: {
        subject: `A remembrance for ${name} is near`,
        heading: `${name}'s remembrance day is near`,
        body: `${name}'s remembrance day is ${d}. Take a moment to light a candle and leave a few words.`,
        button: "Open the memorial",
      },
    };
    return table[l]!;
  }

  if (occasion === "qingming") {
    const table: Record<string, Copy> = {
      "zh-CN": {
        subject: "【清明】慎终追远，缅怀故人",
        heading: "清明将至",
        body: `清明将至（${d}）。愿在这慎终追远的日子，为思念的人点一盏灯、寄一分思念。`,
        button: "前往我的追思",
      },
      "zh-TW": {
        subject: "【清明】慎終追遠，緬懷故人",
        heading: "清明將至",
        body: `清明將至（${d}）。願在這慎終追遠的日子，為思念的人點一盞燈、寄一分思念。`,
        button: "前往我的追思",
      },
      en: {
        subject: "Qingming is near — a time to remember",
        heading: "Qingming is near",
        body: `Qingming falls on ${d}. A time to remember those we miss and tend their memory.`,
        button: "Open my memorials",
      },
    };
    return table[l]!;
  }

  const table: Record<string, Copy> = {
    "zh-CN": {
      subject: "【中元】寄一分思念给远方的亲人",
      heading: "中元将至",
      body: `中元将至（${d}）。愿在这一天，为远方的亲人点一盏灯、寄一分思念。`,
      button: "前往我的追思",
    },
    "zh-TW": {
      subject: "【中元】寄一分思念給遠方的親人",
      heading: "中元將至",
      body: `中元將至（${d}）。願在這一天，為遠方的親人點一盞燈、寄一分思念。`,
      button: "前往我的追思",
    },
    en: {
      subject: "Zhongyuan is near — a time to remember",
      heading: "Zhongyuan is near",
      body: `The Zhongyuan Festival falls on ${d}. A time to remember those we miss.`,
      button: "Open my memorials",
    },
  };
  return table[l]!;
}

function unsubscribeText(locale: string): string {
  const l = pick(locale);
  if (l === "zh-CN") return "不想再收到这类提醒？点此退订。";
  if (l === "zh-TW") return "不想再收到這類提醒？點此退訂。";
  return "Don't want these reminders? Unsubscribe.";
}

export function reminderEmail(
  occasion: ReminderOccasion,
  locale: string,
  p: ReminderParams,
): { subject: string; html: string } {
  const c = copyFor(occasion, locale, p);
  const dir = locale === "ar" ? "rtl" : "ltr";
  const html = [
    `<!doctype html>`,
    `<html lang="${locale}" dir="${dir}">`,
    `<head><meta charset="utf-8"></head>`,
    `<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#fbf6eb;color:#253027;padding:40px 20px;margin:0">`,
    `<div style="max-width:460px;margin:0 auto">`,
    `<h1 style="font-size:20px;font-weight:600;margin:0 0 16px">${c.heading}</h1>`,
    `<p style="font-size:15px;line-height:1.7;margin:0 0 28px">${c.body}</p>`,
    `<p style="margin:0 0 32px"><a href="${p.url}" style="display:inline-block;background:#8a1c14;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:15px">${c.button}</a></p>`,
    `<p style="font-size:12px;color:#8a8079;margin:0"><a href="${p.unsubscribeUrl}" style="color:#8a8079">${unsubscribeText(locale)}</a></p>`,
    `</div>`,
    `</body></html>`,
  ].join("");
  return { subject: c.subject, html };
}

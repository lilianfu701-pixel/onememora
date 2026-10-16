/**
 * The site's legal pages — terms of service, privacy policy, refund policy.
 *
 * Like `content/guides.ts`, the text lives here as data rather than next-intl
 * namespaces: it is long, edited as a whole, and only authored in the launch
 * languages (Simplified Chinese, Traditional Chinese, English, Spanish). Every
 * other locale reads the English version.
 *
 * Bodies use a deliberately tiny markup — `### ` headings, `- ` list items,
 * blank-line-separated paragraphs and `**bold**` — parsed by `parseLegalBody`.
 */
import { LEGAL_EN } from "./en";
import { LEGAL_ES } from "./es";
import { LEGAL_ZH_CN } from "./zh-CN";
import { LEGAL_ZH_HANT } from "./zh-Hant";

export type LegalDocKey = "terms" | "privacy" | "refund";

export const LEGAL_DOC_KEYS: readonly LegalDocKey[] = [
  "terms",
  "privacy",
  "refund",
];

export interface LegalDoc {
  title: string;
  /** One sentence for the page's meta description. */
  description: string;
  /** Already-localised "last updated" line. */
  updated: string;
  body: string;
}

export type LegalSet = Record<LegalDocKey, LegalDoc>;

const BY_LOCALE: Record<string, LegalSet> = {
  "zh-CN": LEGAL_ZH_CN,
  "zh-TW": LEGAL_ZH_HANT,
  "zh-HK": LEGAL_ZH_HANT,
  en: LEGAL_EN,
  es: LEGAL_ES,
};

/** The document in the visitor's language, falling back to English. */
export function legalDoc(key: LegalDocKey, locale: string): LegalDoc {
  return (BY_LOCALE[locale] ?? LEGAL_EN)[key];
}

/** Whether `locale` reads its own translation rather than the English one. */
export function hasOwnLegalText(locale: string): boolean {
  return locale in BY_LOCALE;
}

export type LegalBlock =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] };

/** Splits a body into headings, paragraphs and bullet lists. */
export function parseLegalBody(body: string): LegalBlock[] {
  const blocks: LegalBlock[] = [];
  for (const chunk of body.trim().split(/\n\s*\n/)) {
    const lines = chunk
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    let paragraph: string[] = [];
    let list: string[] = [];
    const flush = (): void => {
      if (paragraph.length) {
        blocks.push({ kind: "paragraph", text: paragraph.join(" ") });
        paragraph = [];
      }
      if (list.length) {
        blocks.push({ kind: "list", items: list });
        list = [];
      }
    };
    for (const line of lines) {
      if (line.startsWith("### ")) {
        flush();
        blocks.push({ kind: "heading", text: line.slice(4).trim() });
      } else if (line.startsWith("- ")) {
        if (paragraph.length) flush();
        list.push(line.slice(2).trim());
      } else {
        if (list.length) flush();
        paragraph.push(line);
      }
    }
    flush();
  }
  return blocks;
}

/** Splits `**bold**` runs out of a line: odd-indexed parts are bold. */
export function splitBold(text: string): string[] {
  return text.split("**");
}

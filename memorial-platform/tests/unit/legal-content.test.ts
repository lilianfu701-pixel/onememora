import { describe, expect, it } from "vitest";
import {
  LEGAL_DOC_KEYS,
  hasOwnLegalText,
  legalDoc,
  parseLegalBody,
  splitBold,
} from "@/content/legal";

const AUTHORED = ["zh-CN", "zh-TW", "zh-HK", "en", "es"] as const;

describe("legal content", () => {
  it("has every document in every authored locale, with no drafting placeholders", () => {
    for (const locale of AUTHORED) {
      for (const key of LEGAL_DOC_KEYS) {
        const doc = legalDoc(key, locale);
        expect(doc.title.length).toBeGreaterThan(0);
        expect(doc.body).toContain("support@missingu.org");
        expect(doc.body).not.toMatch(/【|待填|TODO|XXX/);
        // Bold markers come in pairs, or the page would bold the wrong runs.
        expect(doc.body.split("**").length % 2).toBe(1);
      }
    }
  });

  it("falls back to English for locales without their own text", () => {
    expect(hasOwnLegalText("de")).toBe(false);
    expect(legalDoc("refund", "de")).toBe(legalDoc("refund", "en"));
    expect(legalDoc("terms", "zh-HK")).toBe(legalDoc("terms", "zh-TW"));
  });

  it("keeps the same section count across translations", () => {
    const headings = (locale: string, key: (typeof LEGAL_DOC_KEYS)[number]) =>
      parseLegalBody(legalDoc(key, locale).body).filter(
        (b) => b.kind === "heading",
      ).length;
    for (const key of LEGAL_DOC_KEYS) {
      const reference = headings("zh-CN", key);
      for (const locale of AUTHORED) {
        expect(headings(locale, key)).toBe(reference);
      }
    }
  });
});

describe("parseLegalBody", () => {
  it("splits headings, paragraphs and lists", () => {
    const blocks = parseLegalBody(
      "### 1. Title\nIntro line\n- one\n- two\n\nClosing paragraph",
    );
    expect(blocks).toEqual([
      { kind: "heading", text: "1. Title" },
      { kind: "paragraph", text: "Intro line" },
      { kind: "list", items: ["one", "two"] },
      { kind: "paragraph", text: "Closing paragraph" },
    ]);
  });

  it("marks bold runs at odd indexes", () => {
    expect(splitBold("a **b** c")).toEqual(["a ", "b", " c"]);
  });
});

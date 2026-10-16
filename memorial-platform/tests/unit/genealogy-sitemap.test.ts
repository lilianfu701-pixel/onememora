import { describe, expect, it } from "vitest";
import { genealogyIndexXml, genealogyUrlsetXml } from "@/modules/memorials/genealogy-sitemap";

describe("genealogy sitemap xml", () => {
  it("lists one chunk sitemap per page in the index", () => {
    const xml = genealogyIndexXml("https://missingu.org", 2);
    expect(xml).toContain("<sitemapindex");
    expect(xml).toContain("<loc>https://missingu.org/sitemaps/zh-genealogy-0.xml</loc>");
    expect(xml).toContain("<loc>https://missingu.org/sitemaps/zh-genealogy-1.xml</loc>");
    expect(xml).not.toContain("zh-genealogy-2.xml");
  });

  it("lists only the zh-CN address of each page, escaped", () => {
    const xml = genealogyUrlsetXml("https://missingu.org/", [
      { slug: "li-dailong-1", publishedAt: new Date("2026-09-25T00:00:00Z") },
      { slug: "a&b", publishedAt: null },
    ]);
    expect(xml).toContain("<loc>https://missingu.org/zh-CN/memorials/li-dailong-1</loc><lastmod>2026-09-25T00:00:00.000Z</lastmod>");
    expect(xml).toContain("<loc>https://missingu.org/zh-CN/memorials/a&amp;b</loc><changefreq>");
    expect(xml).not.toMatch(/\/(en|es)\/memorials\//);
  });
});

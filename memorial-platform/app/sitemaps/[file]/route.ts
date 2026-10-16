import { siteUrl } from "@/lib/env";
import {
  countGenealogyPages,
  genealogyIndexXml,
  genealogyPage,
  genealogyUrlsetXml,
  GENEALOGY_URLS_PER_SITEMAP,
} from "@/modules/memorials/genealogy-sitemap";

/**
 * Extra sitemaps, served as files so the locale middleware leaves them alone:
 *   /sitemaps/zh-genealogy.xml      index of the Chinese genealogy sitemaps
 *   /sitemaps/zh-genealogy-{n}.xml  one page of up to 40,000 zh-CN genealogy URLs
 */
export const dynamic = "force-dynamic";
export const revalidate = 3600;

const CHUNK = /^zh-genealogy-(\d{1,4})\.xml$/;

function xml(body: string): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
): Promise<Response> {
  const { file } = await params;
  const base = siteUrl().replace(/\/+$/, "");

  if (file === "zh-genealogy.xml") {
    const total = await countGenealogyPages();
    const pages = Math.max(1, Math.ceil(total / GENEALOGY_URLS_PER_SITEMAP));
    return xml(genealogyIndexXml(base, pages));
  }

  const match = CHUNK.exec(file);
  if (!match) return new Response("Not found", { status: 404 });
  const rows = await genealogyPage(Number(match[1]));
  if (rows.length === 0 && match[1] !== "0") return new Response("Not found", { status: 404 });
  return xml(genealogyUrlsetXml(base, rows));
}

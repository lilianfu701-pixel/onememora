import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";

/**
 * Crawler policy.
 *
 * The disallow list is a courtesy, not a control: a crawler that ignores it
 * still gets nothing, because each of these paths refuses the request itself.
 * `/admin` in particular answers 404 to anyone who is not staff, so listing it
 * here does not disclose a way in.
 *
 * Individual memorials are not listed. Whether one may be indexed depends on
 * what its family chose, which is expressed per page through `noindex` and
 * through the sitemap, not through a pattern that would have to enumerate them.
 */
export default function robots(): MetadataRoute.Robots {
  const appUrl = siteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        // Public memorial images are served through this API path so the storage
        // bucket can stay private; it must stay crawlable for Google Images and
        // rich results. A longer, more specific rule wins over `/api/` below.
        allow: ["/", "/api/media/public/"],
        disallow: [
          "/api/",
          // Staff surfaces, the sign-in flow, and private/owner-only surfaces
          // have nothing to index.
          "/*/admin",
          "/*/sign-in",
          "/*/manage",
          "/*/account",
          "/*/inbox",
        ],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
    host: appUrl,
  };
}

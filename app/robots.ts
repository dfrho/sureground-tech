import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo/jsonld";

/**
 * Allow all. Scorecard results are never a URL, so there is nothing to
 * disallow. Hosts other than sureground.tech still get an X-Robots-Tag
 * noindex header from next.config.ts.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}

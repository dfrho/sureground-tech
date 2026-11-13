import type { MetadataRoute } from "next";

import { services } from "@/content/services";
import { listPosts, listTags, postHref } from "@/lib/blog/posts";
import { absoluteUrl } from "@/lib/seo/jsonld";

/** Every public page. Drafts never appear. Phase 5 adds the scorecard. */
export default function sitemap(): MetadataRoute.Sitemap {
  const published = listPosts({ drafts: false });
  const paths = [
    "/",
    "/services",
    ...services.map((s) => `/services/${s.slug}`),
    "/pricing",
    "/about",
    "/contact",
    "/legal/privacy",
    "/legal/terms",
    "/blog",
    ...listTags(published).map((t) => `/blog/tag/${t.slug}`),
  ];
  return [
    ...paths.map((path) => ({ url: absoluteUrl(path) })),
    ...published.map((p) => ({
      url: absoluteUrl(postHref(p.slug)),
      lastModified: p.updated ?? p.date,
    })),
  ];
}

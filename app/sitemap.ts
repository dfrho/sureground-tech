import type { MetadataRoute } from "next";

import { services } from "@/content/services";
import { listPosts, listTags, postHref } from "@/lib/blog/posts";
import { absoluteUrl } from "@/lib/seo/jsonld";

/** Every public page. Drafts never appear. Later phases add the scorecard and contact. */
export default function sitemap(): MetadataRoute.Sitemap {
  const published = listPosts({ drafts: false });
  const paths = [
    "/",
    "/services",
    ...services.map((s) => `/services/${s.slug}`),
    "/pricing",
    "/about",
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

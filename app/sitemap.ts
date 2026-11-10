import type { MetadataRoute } from "next";

import { services } from "@/content/services";
import { absoluteUrl } from "@/lib/seo/jsonld";

/** Every public page. Later phases add the scorecard, contact and blog. */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    "/services",
    ...services.map((s) => `/services/${s.slug}`),
    "/pricing",
    "/about",
    "/legal/privacy",
    "/legal/terms",
  ];
  return paths.map((path) => ({ url: absoluteUrl(path) }));
}

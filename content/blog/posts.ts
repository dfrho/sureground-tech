import { postMetaSchema, type PostMeta } from "@/lib/blog/schema";

/**
 * Every blog post's metadata. The body of each post is content/blog/<slug>.mdx.
 * Metadata lives here rather than as an MDX export so unit tests, the sitemap
 * and the RSS feed can read it without compiling MDX (see docs/decisions.md).
 * Posts with draft: true never reach production, the sitemap or RSS.
 */
const raw: PostMeta[] = [
  {
    slug: "google-ai-mode-home-services-booking",
    title: "Google AI Mode Now Books Home Services: What Local Owners Should Do Next",
    description:
      "Google AI Mode now shows booking and quote links for U.S. home services through partner platforms. What changed, and what to check before the requests arrive.",
    date: "2026-11-13",
    tags: ["Home services", "AI in operations"],
    draft: false,
    readingMinutes: 2,
  },
];

export const allPosts: readonly PostMeta[] = raw.map((p) => postMetaSchema.parse(p));

{
  const slugs = new Set<string>();
  for (const p of allPosts) {
    if (slugs.has(p.slug)) throw new Error(`Duplicate blog slug: ${p.slug}`);
    slugs.add(p.slug);
  }
}

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
  {
    slug: "you-dont-have-to-be-the-ai-pioneer",
    title: "You Don't Have to Be the AI Pioneer",
    description:
      "Why most owners are still experimenting with AI, and how to catch up safely with patterns that have already worked somewhere else.",
    date: "2026-11-13",
    tags: ["Getting started"],
    draft: true,
    readingMinutes: 1,
  },
  {
    slug: "shadow-ai-is-already-in-your-business",
    title: "Shadow AI Is Already in Your Business",
    description:
      "Your team is probably using AI tools you never approved. What to inventory first, and a starter acceptable-use policy you can adapt.",
    date: "2026-11-13",
    tags: ["AI safety", "Getting started"],
    draft: true,
    readingMinutes: 1,
  },
  {
    slug: "what-a-security-reviewer-will-ask-about-your-ai-vendor",
    title: "What a Security Reviewer Will Ask About Your AI Vendor",
    description:
      "The questions buyers now send in pre-sales about the AI tools you use, and how to have answers ready before the questionnaire arrives.",
    date: "2026-11-13",
    tags: ["AI safety", "Security reviews"],
    draft: true,
    readingMinutes: 1,
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

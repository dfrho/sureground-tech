import { z } from "zod";

/**
 * Metadata for one blog post. Every post is validated with this schema when
 * content/blog/posts.ts loads, so invalid metadata fails the build.
 */
export const postMetaSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "lowercase words joined by hyphens"),
  title: z.string().min(10).max(110),
  description: z.string().min(50).max(200),
  date: z.iso.date(),
  updated: z.iso.date().optional(),
  tags: z.array(z.string().min(2).max(40)).min(1).max(5),
  draft: z.boolean(),
  /** Minutes at about 230 words a minute; a unit test checks it against the MDX file. */
  readingMinutes: z.number().int().min(1).max(60),
  /** Optional Open Graph image path in /public; a generated image is used otherwise. */
  ogImage: z.string().startsWith("/").optional(),
});

export type PostMeta = z.infer<typeof postMetaSchema>;

export const WORDS_PER_MINUTE = 230;

/** Reading time for a body of text, rounded up to the next whole minute. */
export function readingMinutes(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

/** URL segment for a tag: "AI in operations" becomes "ai-in-operations". */
export function tagSlug(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

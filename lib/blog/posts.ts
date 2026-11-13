import { allPosts } from "@/content/blog/posts";
import { tagSlug, type PostMeta } from "@/lib/blog/schema";

/**
 * Drafts show in local development and on Vercel preview deployments, so
 * David can review them on his phone, and never in a production build.
 */
export function includeDrafts(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.VERCEL_ENV) return env.VERCEL_ENV !== "production";
  return env.NODE_ENV !== "production";
}

export const POSTS_PER_PAGE = 10;

/** Visible posts, newest first (ties broken by title so the order is stable). */
export function listPosts(opts: { drafts?: boolean } = {}): PostMeta[] {
  const drafts = opts.drafts ?? includeDrafts();
  return allPosts
    .filter((p) => drafts || !p.draft)
    .toSorted((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
}

export function getPost(slug: string, opts: { drafts?: boolean } = {}): PostMeta | undefined {
  return listPosts(opts).find((p) => p.slug === slug);
}

export function postHref(slug: string): string {
  return `/blog/${slug}`;
}

export function tagHref(tag: string): string {
  return `/blog/tag/${tagSlug(tag)}`;
}

/** Each tag in use, with its display name taken from the first post that uses it. */
export function listTags(posts: PostMeta[] = listPosts()): { slug: string; name: string }[] {
  const tags = new Map<string, string>();
  for (const p of posts) for (const t of p.tags) if (!tags.has(tagSlug(t))) tags.set(tagSlug(t), t);
  return [...tags]
    .map(([slug, name]) => ({ slug, name }))
    .toSorted((a, b) => a.name.localeCompare(b.name));
}

export function postsForTag(slug: string, posts: PostMeta[] = listPosts()): PostMeta[] {
  return posts.filter((p) => p.tags.some((t) => tagSlug(t) === slug));
}

/** The posts either side of this one in the index (newer and older). */
export function neighbours(
  slug: string,
  posts: PostMeta[] = listPosts(),
): { newer?: PostMeta; older?: PostMeta } {
  const i = posts.findIndex((p) => p.slug === slug);
  if (i === -1) return {};
  return { newer: posts[i - 1], older: posts[i + 1] };
}

export function pageCount(posts: PostMeta[] = listPosts()): number {
  return Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
}

/** One page of the index, numbered from 1. */
export function postsOnPage(page: number, posts: PostMeta[] = listPosts()): PostMeta[] {
  return posts.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);
}

/** "November 13, 2026" from "2026-11-13", without time zone drift. */
export function formatPostDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y!, m! - 1, d!)));
}

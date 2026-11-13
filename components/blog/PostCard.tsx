import Link from "next/link";

import { formatPostDate, postHref, tagHref } from "@/lib/blog/posts";
import type { PostMeta } from "@/lib/blog/schema";

/** Date, reading time and a draft badge, in mono. */
export function PostMetaLine({ post }: { post: PostMeta }) {
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-label text-muted uppercase">
      <time dateTime={post.date}>{formatPostDate(post.date)}</time>
      <span aria-hidden="true">/</span>
      <span>{post.readingMinutes} min read</span>
      {post.draft ? (
        <span className="rounded-button bg-highlight px-2 py-0.5 text-on-highlight">Draft</span>
      ) : null}
    </p>
  );
}

export function TagList({ tags }: { tags: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Tags">
      {tags.map((t) => (
        <li key={t}>
          <Link
            href={tagHref(t)}
            className="relative z-10 inline-flex min-h-11 items-center rounded-button border border-border px-3 text-small hover:border-accent-text"
          >
            {t}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** One post in a list: the whole card links to the post; tags link to their pages. */
export function PostCard({ post, headingLevel = 2 }: { post: PostMeta; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className="relative flex h-full flex-col gap-3 rounded-card border border-border bg-surface p-6 focus-within:border-accent-text hover:border-accent-text">
      <PostMetaLine post={post} />
      <Heading className="font-display text-h3">
        <Link
          href={postHref(post.slug)}
          className="after:absolute after:inset-0 after:rounded-card"
        >
          {post.title}
        </Link>
      </Heading>
      <p className="text-muted">{post.description}</p>
      <div className="mt-auto pt-2">
        <TagList tags={post.tags} />
      </div>
    </article>
  );
}

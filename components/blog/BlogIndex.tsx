import Link from "next/link";

import { PostCard } from "@/components/blog/PostCard";
import { CTA } from "@/components/site/CTA";
import { listTags } from "@/lib/blog/posts";
import type { PostMeta } from "@/lib/blog/schema";

/** The blog index and tag pages share this layout. */
export function BlogIndex({
  eyebrow,
  title,
  intro,
  posts,
  page,
  pages,
  basePath,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  posts: PostMeta[];
  page: number;
  pages: number;
  basePath: string;
}) {
  const tags = listTags();
  return (
    <>
      <section aria-labelledby="blog-title" className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-12 sm:px-6 sm:py-16">
          <p className="font-mono text-label text-muted uppercase">{eyebrow}</p>
          <h1 id="blog-title" className="max-w-3xl font-display text-h1">
            {title}
          </h1>
          <p className="max-w-2xl text-muted">{intro}</p>
          {tags.length > 0 ? (
            <nav aria-label="Topics" className="mt-2">
              <ul className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <li key={t.slug}>
                    <Link
                      href={`/blog/tag/${t.slug}`}
                      className="inline-flex min-h-11 items-center rounded-button border border-border px-3 text-small hover:border-accent-text"
                    >
                      {t.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </div>
      </section>

      <section aria-label="Posts" className="py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {posts.length === 0 ? (
            <p className="text-muted">No posts yet.</p>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {posts.map((p) => (
                <li key={p.slug}>
                  <PostCard post={p} />
                </li>
              ))}
            </ul>
          )}

          {pages > 1 ? (
            <nav aria-label="Pages" className="mt-10 flex items-center justify-between gap-4">
              {page > 1 ? (
                <Link
                  href={page === 2 ? basePath : `${basePath}/page/${page - 1}`}
                  className="inline-flex min-h-11 items-center underline underline-offset-4"
                >
                  Newer posts
                </Link>
              ) : (
                <span />
              )}
              <p className="font-mono text-label text-muted">
                Page {page} of {pages}
              </p>
              {page < pages ? (
                <Link
                  href={`${basePath}/page/${page + 1}`}
                  className="inline-flex min-h-11 items-center underline underline-offset-4"
                >
                  Older posts
                </Link>
              ) : (
                <span />
              )}
            </nav>
          ) : null}
        </div>
      </section>

      <CTA />
    </>
  );
}

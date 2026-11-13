import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PostMetaLine, TagList } from "@/components/blog/PostCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { CTA } from "@/components/site/CTA";
import { loadPostBody } from "@/lib/blog/content";
import { getPost, listPosts, neighbours, postHref } from "@/lib/blog/posts";
import { blogPostingLd, breadcrumbLd } from "@/lib/seo/jsonld";

// Only posts in content/blog/posts.ts exist; any other slug is a 404 (A01).
export const dynamicParams = false;

export function generateStaticParams() {
  return listPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return {};
  const path = postHref(post.slug);
  return {
    title: post.title,
    description: post.description,
    keywords: post.tags,
    alternates: { canonical: path },
    robots: post.draft ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: path,
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      tags: post.tags,
      ...(post.ogImage ? { images: [post.ogImage] } : {}),
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.description },
  };
}

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  const Body = await loadPostBody(post.slug);
  const { newer, older } = neighbours(post.slug);
  const path = postHref(post.slug);

  return (
    <>
      <JsonLd data={blogPostingLd(post)} />
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: post.title, path },
        ])}
      />

      <article aria-labelledby="post-title">
        <header className="border-b border-border">
          <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-12 sm:px-6 sm:py-16">
            <nav aria-label="Breadcrumb">
              <ol className="flex flex-wrap gap-2 font-mono text-label text-muted uppercase">
                <li>
                  <Link
                    href="/blog"
                    className="inline-flex min-h-11 min-w-11 items-center underline-offset-4 hover:text-text hover:underline"
                  >
                    Blog
                  </Link>
                </li>
              </ol>
            </nav>
            <h1 id="post-title" className="font-display text-h1">
              {post.title}
            </h1>
            <PostMetaLine post={post} />
            <TagList tags={post.tags} />
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <div className="prose">
            <Body />
          </div>
        </div>
      </article>

      {newer || older ? (
        <nav aria-label="More posts" className="border-t border-border">
          <div className="mx-auto grid max-w-3xl gap-4 px-4 py-10 sm:grid-cols-2 sm:px-6">
            {older ? (
              <Link
                href={postHref(older.slug)}
                className="flex min-h-11 flex-col gap-1 rounded-card border border-border bg-surface p-5 hover:border-accent-text"
              >
                <span className="font-mono text-label text-muted uppercase">Previous</span>
                <span className="font-display">{older.title}</span>
              </Link>
            ) : (
              <span className="hidden sm:block" />
            )}
            {newer ? (
              <Link
                href={postHref(newer.slug)}
                className="flex min-h-11 flex-col gap-1 rounded-card border border-border bg-surface p-5 text-right hover:border-accent-text"
              >
                <span className="font-mono text-label text-muted uppercase">Next</span>
                <span className="font-display">{newer.title}</span>
              </Link>
            ) : null}
          </div>
        </nav>
      ) : null}

      <CTA
        title="Not sure where your business stands?"
        body="The First Step Scorecard takes five minutes and tells you how solid your ground is and what your first step should be."
      />
    </>
  );
}

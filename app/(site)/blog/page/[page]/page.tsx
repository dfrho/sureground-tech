import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlogIndex } from "@/components/blog/BlogIndex";
import { listPosts, pageCount, postsOnPage } from "@/lib/blog/posts";

// Only real page numbers exist; page 1 is /blog itself (A01).
export const dynamicParams = false;

export function generateStaticParams() {
  const pages = pageCount();
  return Array.from({ length: Math.max(0, pages - 1) }, (_, i) => ({ page: String(i + 2) }));
}

function parse(value: string): number | null {
  const page = Number(value);
  return Number.isInteger(page) && page >= 2 && page <= pageCount() ? page : null;
}

export async function generateMetadata({
  params,
}: PageProps<"/blog/page/[page]">): Promise<Metadata> {
  const page = parse((await params).page);
  if (!page) return {};
  return { title: `Blog, page ${page}`, alternates: { canonical: `/blog/page/${page}` } };
}

export default async function BlogPageN({ params }: PageProps<"/blog/page/[page]">) {
  const page = parse((await params).page);
  if (!page) notFound();
  const posts = listPosts();
  return (
    <BlogIndex
      eyebrow={`Blog / Page ${page}`}
      title="Notes from proven ground."
      intro="Plain-language notes for owners on putting AI to work safely."
      posts={postsOnPage(page, posts)}
      page={page}
      pages={pageCount(posts)}
      basePath="/blog"
    />
  );
}

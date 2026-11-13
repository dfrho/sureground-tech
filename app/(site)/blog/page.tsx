import type { Metadata } from "next";

import { BlogIndex } from "@/components/blog/BlogIndex";
import { JsonLd } from "@/components/seo/JsonLd";
import { listPosts, pageCount, postsOnPage } from "@/lib/blog/posts";
import { breadcrumbLd } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Plain-language notes for owners on putting AI to work safely: what changed, what it means for your operations, and what to do next.",
  alternates: {
    canonical: "/blog",
    types: { "application/rss+xml": "/blog/rss.xml" },
  },
};

export default function BlogPage() {
  const posts = listPosts();
  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
        ])}
      />
      {/* COPY: draft (heading and intro) */}
      <BlogIndex
        eyebrow="Blog"
        title="Notes from proven ground."
        intro="Plain-language notes for owners on putting AI to work safely: what changed, what it means for your operations, and what to do next."
        posts={postsOnPage(1, posts)}
        page={1}
        pages={pageCount(posts)}
        basePath="/blog"
      />
    </>
  );
}

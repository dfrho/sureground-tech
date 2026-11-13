import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlogIndex } from "@/components/blog/BlogIndex";
import { JsonLd } from "@/components/seo/JsonLd";
import { listTags, postsForTag } from "@/lib/blog/posts";
import { breadcrumbLd } from "@/lib/seo/jsonld";

// Only tags used by a visible post have pages (A01).
export const dynamicParams = false;

export function generateStaticParams() {
  return listTags().map((t) => ({ tag: t.slug }));
}

function findTag(slug: string) {
  return listTags().find((t) => t.slug === slug);
}

export async function generateMetadata({
  params,
}: PageProps<"/blog/tag/[tag]">): Promise<Metadata> {
  const tag = findTag((await params).tag);
  if (!tag) return {};
  return {
    title: `${tag.name} posts`,
    description: `Posts on ${tag.name.toLowerCase()} from SureGround.`,
    alternates: { canonical: `/blog/tag/${tag.slug}` },
  };
}

export default async function TagPage({ params }: PageProps<"/blog/tag/[tag]">) {
  const tag = findTag((await params).tag);
  if (!tag) notFound();
  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: tag.name, path: `/blog/tag/${tag.slug}` },
        ])}
      />
      <BlogIndex
        eyebrow="Blog / Topic"
        title={tag.name}
        intro={`Every post on ${tag.name.toLowerCase()}.`}
        posts={postsForTag(tag.slug)}
        page={1}
        pages={1}
        basePath={`/blog/tag/${tag.slug}`}
      />
    </>
  );
}

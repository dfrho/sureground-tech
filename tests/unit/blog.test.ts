import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { allPosts } from "@/content/blog/posts";
import { includeDrafts, listPosts, listTags, neighbours, formatPostDate } from "@/lib/blog/posts";
import { postMetaSchema, readingMinutes, tagSlug } from "@/lib/blog/schema";
import { xmlEscape } from "@/lib/blog/xml";
import { blogPostingLd } from "@/lib/seo/jsonld";

const dir = join(process.cwd(), "content/blog");

/** The words a reader sees: MDX comments, JSX tags and link targets removed. */
function readableText(mdx: string): string {
  return mdx
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\]\([^)]*\)/g, "]")
    .replace(/[#*[\]]/g, " ");
}

describe("blog content", () => {
  it("has one MDX file per post and no orphan files", () => {
    const files = readdirSync(dir)
      .filter((f) => f.endsWith(".mdx"))
      .map((f) => f.replace(/\.mdx$/, ""))
      .sort();
    expect(files).toEqual(allPosts.map((p) => p.slug).sort());
  });

  it("states each post's reading time correctly", () => {
    for (const p of allPosts) {
      const text = readableText(readFileSync(join(dir, `${p.slug}.mdx`), "utf8"));
      expect(p.readingMinutes, p.slug).toBe(readingMinutes(text));
    }
  });

  it("rejects invalid metadata", () => {
    const good = allPosts[0]!;
    expect(postMetaSchema.safeParse({ ...good, slug: "Bad Slug" }).success).toBe(false);
    expect(postMetaSchema.safeParse({ ...good, date: "13/11/2026" }).success).toBe(false);
    expect(postMetaSchema.safeParse({ ...good, tags: [] }).success).toBe(false);
  });

  it("never states a price in a post (prices come from offers.ts via OfferLink)", () => {
    for (const p of allPosts) {
      const text = readFileSync(join(dir, `${p.slug}.mdx`), "utf8");
      expect(text, p.slug).not.toMatch(/\$\s?\d/);
    }
  });
});

describe("drafts", () => {
  it("are hidden in production and shown in development and previews", () => {
    expect(includeDrafts({ NODE_ENV: "production" } as NodeJS.ProcessEnv)).toBe(false);
    expect(includeDrafts({ NODE_ENV: "development" } as NodeJS.ProcessEnv)).toBe(true);
    expect(
      includeDrafts({ NODE_ENV: "production", VERCEL_ENV: "production" } as NodeJS.ProcessEnv),
    ).toBe(false);
    expect(
      includeDrafts({ NODE_ENV: "production", VERCEL_ENV: "preview" } as NodeJS.ProcessEnv),
    ).toBe(true);
  });

  it("are filtered out of the published list", () => {
    expect(listPosts({ drafts: false }).some((p) => p.draft)).toBe(false);
    expect(listPosts({ drafts: true })).toHaveLength(allPosts.length);
  });
});

describe("blog helpers", () => {
  it("slugs tags", () => {
    expect(tagSlug("AI in operations")).toBe("ai-in-operations");
    expect(tagSlug("  Home services! ")).toBe("home-services");
  });

  it("lists each tag once", () => {
    const tags = listTags(listPosts({ drafts: true }));
    expect(new Set(tags.map((t) => t.slug)).size).toBe(tags.length);
  });

  it("finds newer and older neighbours", () => {
    const posts = listPosts({ drafts: true });
    const { newer, older } = neighbours(posts[1]!.slug, posts);
    expect(newer?.slug).toBe(posts[0]!.slug);
    expect(older?.slug).toBe(posts[2]?.slug);
  });

  it("formats dates without time zone drift", () => {
    expect(formatPostDate("2026-11-13")).toBe("November 13, 2026");
  });

  it("escapes XML", () => {
    expect(xmlEscape(`<a href="x">Tom & Jerry's</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&apos;s&lt;/a&gt;",
    );
  });

  it("builds BlogPosting data with absolute URLs", () => {
    const ld = blogPostingLd(allPosts[0]!);
    expect(ld["@type"]).toBe("BlogPosting");
    expect(ld.url).toBe(`https://sureground.tech/blog/${allPosts[0]!.slug}`);
  });
});

import { listPosts, postHref } from "@/lib/blog/posts";
import { xmlEscape } from "@/lib/blog/xml";
import { site } from "@/lib/config/site";
import { absoluteUrl } from "@/lib/seo/jsonld";

// Built once at build time from repo content; no request input is read.
export const dynamic = "force-static";

function rfc822(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00Z`).toUTCString();
}

/** RSS 2.0 feed of published posts. Drafts never appear, even in development. */
export function GET() {
  const posts = listPosts({ drafts: false });
  const items = posts
    .map((p) => {
      const url = absoluteUrl(postHref(p.slug));
      return [
        "    <item>",
        `      <title>${xmlEscape(p.title)}</title>`,
        `      <link>${xmlEscape(url)}</link>`,
        `      <guid isPermaLink="true">${xmlEscape(url)}</guid>`,
        `      <pubDate>${rfc822(p.date)}</pubDate>`,
        `      <description>${xmlEscape(p.description)}</description>`,
        ...p.tags.map((t) => `      <category>${xmlEscape(t)}</category>`),
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(`${site.name} blog`)}</title>
    <link>${xmlEscape(absoluteUrl("/blog"))}</link>
    <atom:link href="${xmlEscape(absoluteUrl("/blog/rss.xml"))}" rel="self" type="application/rss+xml" />
    <description>${xmlEscape(site.tagline)}</description>
    <language>en-us</language>
${items}
  </channel>
</rss>
`;
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}

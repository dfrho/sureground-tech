import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";

import { formatPostDate, getPost, listPosts } from "@/lib/blog/posts";
import { tokens } from "@/lib/design/tokens";

export const alt = "SureGround blog post";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Only real posts get an image; any other slug is a 404, not a fresh render.
export const dynamicParams = false;

export function generateStaticParams() {
  return listPosts().map((p) => ({ slug: p.slug }));
}

/** Open Graph card for a post: title on Carbon, the three steps and the Volt node. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  const title = post.title;
  const { dark } = tokens;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: dark.bg,
        color: dark.text,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 56 }}>
          <div style={{ width: 18, height: 20, background: dark.text, borderRadius: 3 }} />
          <div style={{ width: 18, height: 36, background: dark.text, borderRadius: 3 }} />
          <div
            style={{
              width: 18,
              height: 56,
              background: dark.text,
              borderRadius: 3,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                marginTop: -16,
                background: dark.highlight,
                borderRadius: 6,
              }}
            />
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 40, fontWeight: 700 }}>
          <span>Sure</span>
          <span style={{ color: dark["accent-text"] }}>Ground</span>
          <span style={{ marginLeft: 12 }}>Tech</span>
        </div>
      </div>
      <div style={{ display: "flex", fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>{title}</div>
      <div style={{ display: "flex", fontSize: 28, color: dark.muted }}>
        {`Blog  /  ${formatPostDate(post.date)}`}
      </div>
    </div>,
    size,
  );
}

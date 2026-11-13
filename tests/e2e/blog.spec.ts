import { expect, test } from "@playwright/test";

import { allPosts } from "../../content/blog/posts";

// Playwright runs against a production build, so drafts must be absent.
const published = allPosts.filter((p) => !p.draft);
const drafts = allPosts.filter((p) => p.draft);
const post = published.find((p) => p.slug === "google-ai-mode-home-services-booking")!;

test("the blog index lists published posts and no drafts", async ({ page }) => {
  await page.goto("/blog");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  for (const p of published) {
    await expect(page.getByRole("link", { name: p.title, exact: true })).toBeVisible();
  }
  for (const d of drafts) {
    await expect(page.getByRole("link", { name: d.title, exact: true })).toHaveCount(0);
  }
});

test("a post shows its title, date, reading time, sources and structured data", async ({
  page,
}) => {
  await page.goto(`/blog/${post.slug}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(post.title);
  await expect(page.getByText(`${post.readingMinutes} min read`)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sources" })).toBeVisible();
  // External links open safely.
  const external = page.locator('.prose a[href^="http"]');
  expect(await external.count()).toBeGreaterThan(0);
  for (const rel of await external.evaluateAll((els) => els.map((e) => e.getAttribute("rel")))) {
    expect(rel).toContain("noopener");
  }
  const types = (await page.locator('script[type="application/ld+json"]').allTextContents()).map(
    (t) => (JSON.parse(t) as { "@type": string })["@type"],
  );
  expect(types).toEqual(expect.arrayContaining(["BlogPosting", "BreadcrumbList"]));
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `https://sureground.tech/blog/${post.slug}`,
  );
  const og = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(og).toBeTruthy();
  const image = await page.request.get(new URL(og!).pathname + new URL(og!).search);
  expect(image.status()).toBe(200);
  expect(image.headers()["content-type"]).toContain("image/png");
  // The closing call to action points at the scorecard.
  await expect(
    page.getByRole("link", { name: /Take the First Step Scorecard/ }).last(),
  ).toBeVisible();
});

test("drafts and unknown slugs are 404 in production", async ({ page }) => {
  for (const slug of [...drafts.map((d) => d.slug), "not-a-post"]) {
    const response = await page.goto(`/blog/${slug}`);
    expect(response?.status(), slug).toBe(404);
  }
});

test("the Open Graph image route is limited to real posts", async ({ page, request }) => {
  await page.goto(`/blog/${post.slug}`);
  const og = new URL((await page.locator('meta[property="og:image"]').getAttribute("content"))!);
  const imagePath = og.pathname.replace(post.slug, "not-a-post");
  expect((await request.get(imagePath)).status()).toBe(404);
});

test("a tag page lists only that tag's posts", async ({ page }) => {
  await page.goto("/blog/tag/home-services");
  await expect(page.getByRole("link", { name: post.title, exact: true })).toBeVisible();
  const response = await page.goto("/blog/tag/not-a-tag");
  expect(response?.status()).toBe(404);
});

test("the RSS feed lists published posts only", async ({ request }) => {
  const response = await request.get("/blog/rss.xml");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/rss+xml");
  const xml = await response.text();
  for (const p of published) expect(xml).toContain(`https://sureground.tech/blog/${p.slug}`);
  for (const d of drafts) expect(xml).not.toContain(d.slug);
});

test("the sitemap lists published posts and no drafts", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  expect(xml).toContain("https://sureground.tech/blog");
  for (const p of published) expect(xml).toContain(`https://sureground.tech/blog/${p.slug}`);
  for (const d of drafts) expect(xml).not.toContain(d.slug);
});

test("home shows the latest posts", async ({ page }) => {
  await page.goto("/");
  const section = page.locator("#blog");
  await expect(section.getByRole("link", { name: post.title, exact: true })).toBeVisible();
});

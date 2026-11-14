import { expect, test } from "@playwright/test";

import { services } from "../../content/services";
import { sources } from "../../content/sources";
import { offers } from "../../lib/config/offers";
import { priceLabel } from "../../lib/offers/format";

async function jsonLdTypes(page: import("@playwright/test").Page): Promise<string[]> {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.map((b) => (JSON.parse(b) as { "@type": string })["@type"]);
}

test("home: hero, cited stats, the path and both calls to action", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "You don't have to be the pioneer.",
  );
  await expect(page.getByRole("link", { name: /Check your AI readiness/ }).first()).toHaveAttribute(
    "href",
    "/scorecard",
  );
  await expect(page.getByRole("link", { name: "Book a free AI Fit Call" }).first()).toHaveAttribute(
    "href",
    "/contact#book",
  );

  // Every statistic on the page links to its source.
  const why = page.locator("#why");
  for (const s of sources) {
    await expect(why.getByText(s.value, { exact: true })).toBeVisible();
    await expect(why.locator(`a[href="${s.url}"]`).first()).toBeVisible();
  }

  // The path reads its prices from offers.ts.
  const path = page.locator("#path");
  for (const slug of [
    "fit-call",
    "safe-start",
    "opportunity-assessment",
    "pilot-sprint",
    "managed-ops",
  ]) {
    const offer = offers.find((o) => o.slug === slug)!;
    await expect(path.getByRole("link", { name: offer.name })).toBeVisible();
    await expect(path.getByText(priceLabel(offer), { exact: true }).first()).toBeVisible();
  }

  expect(await jsonLdTypes(page)).toContain("ProfessionalService");
});

test("the path cards are all the same height and line up", async ({ page }) => {
  await page.goto("/");
  const boxes = await page
    .locator("#path ol > li")
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect()));
  expect(boxes).toHaveLength(4);
  for (const box of boxes) expect(Math.round(box.height)).toBe(Math.round(boxes[0]!.height));
  // On wide screens all four sit in one row with a shared top edge.
  if ((page.viewportSize()?.width ?? 0) >= 1024) {
    for (const box of boxes) expect(Math.round(box.top)).toBe(Math.round(boxes[0]!.top));
  }
});

test("pricing lists every offer with its price from offers.ts", async ({ page }) => {
  await page.goto("/pricing");
  // The table shows on wide screens and the cards on narrow ones; check whichever is visible.
  const visible = page.locator("main table, main .lg\\:hidden").filter({ visible: true });
  await expect(visible).toHaveCount(1);
  for (const offer of offers) {
    await expect(visible.getByRole("link", { name: offer.name, exact: true })).toBeVisible();
    await expect(visible.getByText(priceLabel(offer), { exact: true }).first()).toBeVisible();
  }
  const text = await page.locator("main").innerText();
  expect(text).not.toMatch(/per hour|hourly/i);
});

test("the services index shows no prices", async ({ page }) => {
  await page.goto("/services");
  const text = await page.locator("main").innerText();
  expect(text).not.toMatch(/\$\s?\d/);
  expect(text).not.toMatch(/starting at|per month/i);
});

for (const s of services) {
  test(`service page ${s.slug} shows its offer and structured data`, async ({ page }) => {
    const offer = offers.find((o) => o.slug === s.slug)!;
    const response = await page.goto(`/services/${s.slug}`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(s.headline);
    await expect(
      page.getByLabel("At a glance").getByText(priceLabel(offer), { exact: true }),
    ).toBeVisible();
    for (const term of offer.terms) {
      await expect(page.getByLabel("At a glance").getByText(term, { exact: true })).toBeVisible();
    }
    expect(await jsonLdTypes(page)).toEqual(expect.arrayContaining(["Service", "BreadcrumbList"]));
  });
}

test("an unknown service slug is a 404", async ({ page }) => {
  const response = await page.goto("/services/not-an-offer");
  expect(response?.status()).toBe(404);
});

test("about shows David's photo and Person data", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("img", { name: /David Rhodes/ })).toBeVisible();
  expect(await jsonLdTypes(page)).toContain("Person");
  const text = await page.locator("main").innerText();
  expect(text).not.toMatch(/gmail|\(\d{3}\)/i);
});

test("about photo lines up with the heading block on wide screens", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 768, "photo stacks above the heading on phones");
  await page.goto("/about");
  const photo = await page.getByRole("img", { name: /David Rhodes/ }).boundingBox();
  const text = await page.locator("#about-title").locator("..").boundingBox();
  expect(Math.round(photo!.y)).toBe(Math.round(text!.y));
  expect(Math.round(photo!.y + photo!.height)).toBe(Math.round(text!.y + text!.height));
});

test("the legal pages show no draft banner", async ({ page }) => {
  // David removed both draft banners on 2026-11-14.
  for (const [path, title] of [
    ["/legal/privacy", "Privacy policy"],
    ["/legal/terms", "Terms of use"],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(page.getByRole("note")).toHaveCount(0);
  }
});

test("sitemap and robots", async ({ request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  for (const s of services) expect(sitemap).toContain(`https://sureground.tech/services/${s.slug}`);
  expect(sitemap).toContain("https://sureground.tech/pricing");
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Sitemap: https://sureground.tech/sitemap.xml");
});

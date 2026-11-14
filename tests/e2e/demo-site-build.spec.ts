import { expect, test } from "@playwright/test";

import { getOffer } from "../../lib/config/offers";
import { addOnLabel, formatUsd } from "../../lib/offers/format";

const offer = getOffer("demo-site-build");

test.describe("Guided Demo Site Build (Phase 7)", () => {
  test("the page shows tiers, add-ons and terms from offers.ts", async ({ page }) => {
    await page.goto("/services/demo-site-build");
    const glance = page.getByLabel("At a glance");
    for (const tier of offer.tiers!) {
      await expect(
        glance.getByText(`${tier.name} (${tier.duration}): ${formatUsd(tier.startingAt)}`),
      ).toBeVisible();
    }
    for (const addOn of offer.addOns!) {
      await expect(glance.getByText(addOnLabel(addOn), { exact: true })).toBeVisible();
    }
  });

  test("the page sends buyers to contact, never to the scorecard", async ({ page }) => {
    await page.goto("/services/demo-site-build");
    await expect(page.locator('main a[href^="/scorecard"]')).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Book a free call" })).toHaveAttribute(
      "href",
      "/contact?topic=demo-build#book",
    );
    await expect(
      page.getByRole("link", { name: "Send us the demo you want to fix" }),
    ).toHaveAttribute("href", "/contact?topic=demo-build");
  });

  test("the scorecard arrival variant does not bring the scorecard back", async ({ page }) => {
    await page.goto("/services/demo-site-build?from=scorecard");
    await expect(page.locator('main a[href^="/scorecard"]')).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Book a free call" })).toBeVisible();
  });

  test("the CTA presets the contact topic", async ({ page }) => {
    await page.goto("/services/demo-site-build");
    await page.getByRole("link", { name: "Send us the demo you want to fix" }).click();
    await expect(page).toHaveURL(/\/contact\?topic=demo-build$/);
    await expect(page.getByLabel("Topic")).toHaveValue("Demo build");
  });

  test("Book a free call lands on the booking section with the topic set", async ({ page }) => {
    await page.goto("/services/demo-site-build");
    await page.getByRole("link", { name: "Book a free call" }).click();
    await expect(page).toHaveURL(/\/contact\?topic=demo-build#book$/);
    await expect(page.locator("#book")).toBeInViewport();
    await expect(page.getByLabel("Topic")).toHaveValue("Demo build");
  });

  test("an unknown topic value is ignored", async ({ page }) => {
    await page.goto("/contact?topic=%3Cscript%3E");
    await expect(page.getByLabel("Topic")).toHaveValue("");
    await expect(page.locator("main")).not.toContainText("<script>");
  });

  test("Answer Engine and Fractional SE link to it", async ({ page }) => {
    for (const slug of ["answer-engine", "fractional-se"]) {
      await page.goto(`/services/${slug}`);
      await expect(
        page.locator("#related-title + div").getByRole("link", { name: offer.name }),
      ).toBeVisible();
    }
  });

  test("it is not on the home page yet", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('main a[href="/services/demo-site-build"]')).toHaveCount(0);
    await expect(page.locator("main")).not.toContainText(offer.name);
  });

  test("pricing shows its add-ons", async ({ page }) => {
    await page.goto("/pricing");
    const visible = page.locator("main table, main .lg\\:hidden").filter({ visible: true });
    for (const addOn of offer.addOns!) {
      await expect(visible.getByText(addOnLabel(addOn), { exact: true })).toBeVisible();
    }
  });
});

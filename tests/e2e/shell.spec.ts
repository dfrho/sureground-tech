import { expect, test, type Page } from "@playwright/test";

import { services } from "../../content/services";

const bg = { light: "rgb(242, 242, 239)", dark: "rgb(14, 17, 22)" } as const;
type Scheme = keyof typeof bg;

// Every page that exists so far. Later phases add their pages here.
const pages = [
  { path: "/", name: "home", status: 200 },
  { path: "/services", name: "services", status: 200 },
  ...services.map((s) => ({ path: `/services/${s.slug}`, name: `service-${s.slug}`, status: 200 })),
  { path: "/pricing", name: "pricing", status: 200 },
  { path: "/about", name: "about", status: 200 },
  { path: "/contact", name: "contact", status: 200 },
  { path: "/scorecard", name: "scorecard", status: 200 },
  { path: "/legal/privacy", name: "privacy", status: 200 },
  { path: "/legal/terms", name: "terms", status: 200 },
  { path: "/blog", name: "blog", status: 200 },
  {
    path: "/blog/google-ai-mode-home-services-booking",
    name: "blog-post-ai-mode",
    status: 200,
  },
  { path: "/blog/tag/home-services", name: "blog-tag", status: 200 },
  { path: "/this-page-does-not-exist", name: "not-found", status: 404 },
];

const isDesktop = (page: Page) => (page.viewportSize()?.width ?? 0) >= 1024;

/** The theme toggle that is on screen: in the header on desktop, in the menu otherwise. */
async function themeToggle(page: Page) {
  if (!isDesktop(page)) await page.getByRole("button", { name: "Open menu" }).click();
  const toggle = page.locator("[data-theme-toggle][data-ready]").filter({ visible: true });
  await expect(toggle).toHaveCount(1);
  return toggle;
}

for (const { path, name, status } of pages) {
  test.describe(`${name} page`, () => {
    test("renders the shell in the system theme", async ({ page }, testInfo) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(status);

      const scheme = testInfo.project.use.colorScheme as Scheme;
      await expect(page.locator("html")).toHaveClass(new RegExp(`\\b${scheme}\\b`));
      await expect(page.locator("body")).toHaveCSS("background-color", bg[scheme]);

      await expect(page.getByRole("banner")).toBeVisible();
      await expect(page.getByRole("main")).toBeVisible();
      await expect(page.getByRole("contentinfo")).toBeVisible();
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);

      await page.evaluate(() => document.fonts.ready);
      // Let one-shot animations (the hero step motif) finish before the screenshot.
      await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));
      const shot = testInfo.outputPath(`${name}-${testInfo.project.name}.png`);
      await page.screenshot({ path: shot, fullPage: true });
      await testInfo.attach(`${name}-${testInfo.project.name}`, {
        path: shot,
        contentType: "image/png",
      });
    });

    test("every header and footer control is at least 44px", async ({ page }) => {
      await page.goto(path);
      const small = await page
        .locator("header a, header button, header label, footer a")
        .evaluateAll((els) =>
          els
            .map((el) => ({ el, box: el.getBoundingClientRect() }))
            // Skip hidden controls and visually hidden text (the skip link).
            .filter(({ box }) => box.width > 1 && box.height > 1)
            .filter(({ box }) => box.width < 44 || box.height < 44)
            .map(
              ({ el, box }) =>
                `${el.textContent?.trim() || el.outerHTML.slice(0, 60)} ${box.width}x${box.height}`,
            ),
        );
      expect(small).toEqual([]);
    });
  });
}

test("the 404 page points to the scorecard", async ({ page }) => {
  await page.goto("/this-page-does-not-exist");
  await expect(page).toHaveTitle("Page not found | SureGround");
  await expect(page.getByRole("main").getByRole("link", { name: /Scorecard/ })).toHaveAttribute(
    "href",
    "/scorecard",
  );
});

test("the skip link is the first tab stop and moves focus to main", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
});

test("navigation: inline on desktop, a menu dialog on smaller screens", async ({ page }) => {
  await page.goto("/");
  const menuButton = page.getByRole("button", { name: "Open menu" });

  if (isDesktop(page)) {
    await expect(menuButton).toBeHidden();
    const nav = page.getByRole("banner").getByRole("navigation", { name: "Main" });
    for (const label of ["Services", "Pricing", "Scorecard", "Blog", "About"]) {
      await expect(nav.getByRole("link", { name: label })).toBeVisible();
    }
    await expect(page.getByRole("banner").getByRole("link", { name: "Book a call" })).toBeVisible();
    return;
  }

  await expect(menuButton).toHaveAttribute("aria-expanded", "false");
  await menuButton.click();
  const dialog = page.getByRole("dialog", { name: "Menu" });
  await expect(dialog).toBeVisible();
  await expect(menuButton).toHaveAttribute("aria-expanded", "true");
  for (const label of ["Services", "Pricing", "Scorecard", "Blog", "About", "Book a call"]) {
    await expect(dialog.getByRole("link", { name: label })).toBeVisible();
  }

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(menuButton).toBeFocused();
  await expect(menuButton).toHaveAttribute("aria-expanded", "false");

  await menuButton.click();
  await dialog.getByRole("button", { name: "Close menu" }).click();
  await expect(dialog).toBeHidden();
});

test("the theme toggle switches, persists and does not flash", async ({ page }, testInfo) => {
  const scheme = testInfo.project.use.colorScheme as Scheme;
  const other: Scheme = scheme === "dark" ? "light" : "dark";
  const label = other === "dark" ? "Dark" : "Light";

  await page.goto("/");
  let toggle = await themeToggle(page);
  await expect(toggle.getByRole("radio", { name: "System" })).toBeChecked();
  await toggle.locator(`label[title="${label}"]`).click();
  await expect(page.locator("html")).toHaveClass(new RegExp(`\\b${other}\\b`));
  await expect(page.locator("body")).toHaveCSS("background-color", bg[other]);

  // On reload the saved choice must already be on <html> when the document
  // finishes parsing, before React hydrates: no flash of the system theme.
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      (window as unknown as { __themeAtParse: string }).__themeAtParse =
        document.documentElement.className;
    });
  });
  await page.reload();
  const atParse = await page.evaluate(
    () => (window as unknown as { __themeAtParse: string }).__themeAtParse,
  );
  expect(atParse).toContain(other);

  toggle = await themeToggle(page);
  await expect(toggle.getByRole("radio", { name: label })).toBeChecked();
  await toggle.locator('label[title="System"]').click();
  await expect(page.locator("html")).toHaveClass(new RegExp(`\\b${scheme}\\b`));
});

test("the theme toggle works from the keyboard", async ({ page }) => {
  await page.goto("/");
  const toggle = await themeToggle(page);
  await toggle.getByRole("radio", { name: "System" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(toggle.getByRole("radio", { name: "Light" })).toBeChecked();
  await expect(page.locator("html")).toHaveClass(/\blight\b/);
});

test("without JavaScript the system theme still applies", async ({
  browser,
  baseURL,
}, testInfo) => {
  const scheme = testInfo.project.use.colorScheme as Scheme;
  const context = await browser.newContext({ javaScriptEnabled: false, colorScheme: scheme });
  const page = await context.newPage();
  await page.goto(new URL("/", baseURL).toString());
  await expect(page.locator("body")).toHaveCSS("background-color", bg[scheme]);
  await context.close();
});

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test, type Page } from "@playwright/test";

/**
 * Contact form and booking. Runs against the production build with
 * Cloudflare's always-pass Turnstile test keys and EMAIL_TRANSPORT=outbox
 * (see playwright.config.ts). Each test sends its own x-real-ip so the
 * per-IP rate limit is exercised without tests affecting each other.
 */

const outbox = join(process.cwd(), ".outbox");

function outboxMessages(): { name: string; subject: string; to: string; replyTo?: string }[] {
  try {
    return readdirSync(outbox)
      .filter((f) => f.endsWith(".json"))
      .map((f) => ({ name: f, ...JSON.parse(readFileSync(join(outbox, f), "utf8")) }));
  } catch {
    return [];
  }
}

async function openContact(page: Page) {
  const octet = () => Math.floor(Math.random() * 250) + 1;
  await page.setExtraHTTPHeaders({ "x-real-ip": `10.${octet()}.${octet()}.${octet()}` });
  await page.goto("/contact");
  // The always-pass test widget adds its token to the form when it is ready.
  await expect(page.locator('input[name="cf-turnstile-response"]')).toHaveValue(/.+/, {
    timeout: 15_000,
  });
}

async function fill(page: Page, values: Partial<Record<string, string>> = {}) {
  const v = {
    name: "Pat Example",
    email: "pat@example.com",
    company: "",
    topic: "Services",
    message: "Hello from the end-to-end test.",
    ...values,
  };
  await page.locator("#field-name").fill(v.name);
  await page.locator("#field-email").fill(v.email);
  await page.locator("#field-company").fill(v.company);
  await page.locator("#field-topic").selectOption(v.topic);
  await page.locator("#field-message").fill(v.message);
}

/** Submits and waits for the Server Action response. */
async function send(page: Page) {
  const done = page.waitForResponse(
    (r) => r.request().method() === "POST" && new URL(r.url()).pathname === "/contact",
  );
  await page.getByRole("button", { name: "Send message" }).click();
  await done;
}

test.describe("contact page", () => {
  test("shows the form, the Turnstile widget and the themed Cal.com embed", async ({
    page,
  }, testInfo) => {
    const violations: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && /Content Security Policy/i.test(msg.text())) {
        violations.push(msg.text());
      }
    });
    await openContact(page);
    await expect(page.getByRole("heading", { name: "Send a message" })).toBeVisible();
    await expect(page.getByRole("link", { name: "david@sureground.tech" }).first()).toHaveAttribute(
      "href",
      "mailto:david@sureground.tech",
    );

    const scheme = testInfo.project.use.colorScheme as "light" | "dark";
    const calFrame = page.locator('[data-testid="cal-embed"] iframe');
    await expect(calFrame).toHaveAttribute("src", /^https:\/\/app\.cal\.com\//, {
      timeout: 15_000,
    });
    await expect(calFrame).toHaveAttribute("src", new RegExp(`theme=${scheme}`));
    expect(violations).toEqual([]);
  });

  test("the Book a call link lands on the booking section", async ({ page }) => {
    await page.goto("/contact#book");
    await expect(page.locator("#book")).toBeInViewport();
  });

  test("arriving from another page loads /contact with its own CSP", async ({ page }) => {
    const violations: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && /Content Security Policy/i.test(msg.text())) {
        violations.push(msg.text());
      }
    });
    await page.goto("/");
    const contactLoad = page.waitForResponse(
      (r) => new URL(r.url()).pathname === "/contact" && r.request().resourceType() === "document",
    );
    // The closing CTA's Fit Call button is on every viewport.
    await page.getByRole("link", { name: "Book a free AI Fit Call" }).last().click();
    const response = await contactLoad;
    expect(response.headers()["content-security-policy"]).toContain("https://app.cal.com");
    await expect(page.locator('[data-testid="cal-embed"] iframe')).toBeAttached({
      timeout: 15_000,
    });
    expect(violations).toEqual([]);
  });
});

test.describe("contact form submission", () => {
  // Submissions write to the shared outbox; one viewport is enough.
  test.beforeEach(async ({ page }, testInfo) => {
    void page;
    test.skip(testInfo.project.name !== "1280-light", "runs once");
  });
  test.describe.configure({ mode: "serial" });

  test("sends a valid message to David with reply-to set", async ({ page }) => {
    await openContact(page);
    const before = new Set(outboxMessages().map((m) => m.name));
    await fill(page, { name: "Pat E2E", message: "Line one.\nLine two." });
    await send(page);
    await expect(page.getByTestId("contact-success")).toBeVisible();
    await expect(page.getByTestId("contact-success")).toBeFocused();

    const added = outboxMessages().filter((m) => !before.has(m.name));
    expect(added).toHaveLength(1);
    expect(added[0]).toMatchObject({
      to: "david@sureground.tech",
      replyTo: "pat@example.com",
      subject: "Contact: Services from Pat E2E",
    });
  });

  test("shows inline errors and keeps what was typed", async ({ page }) => {
    await openContact(page);
    const before = outboxMessages().length;
    // Valid for the browser's type=email check, invalid for the server.
    await fill(page, { email: "pat@example", message: "Keep this text." });
    await send(page);

    const email = page.locator("#field-email");
    await expect(email).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#field-email-error")).toContainText("valid email");
    await expect(page.locator("#contact-form-status [role=alert]")).toContainText(
      "fix the highlighted fields",
    );
    await expect(page.locator("#field-message")).toHaveValue("Keep this text.");
    await expect(page.locator("#field-name")).toHaveValue("Pat Example");
    await expect(page.locator("#field-topic")).toHaveValue("Services");
    expect(outboxMessages().length).toBe(before);
  });

  test("rejects the honeypot without sending", async ({ page }) => {
    await openContact(page);
    const before = outboxMessages().length;
    await fill(page);
    await page.locator('input[name="website"]').evaluate((el) => {
      (el as HTMLInputElement).value = "https://spam.example";
    });
    await send(page);
    await expect(page.locator("#contact-form-status [role=alert]")).toContainText("was not sent");
    await expect(page.getByTestId("contact-success")).toHaveCount(0);
    expect(outboxMessages().length).toBe(before);
  });

  test("blocks the sixth message from one IP within an hour", async ({ page }) => {
    // Six submissions, each waiting for a fresh Turnstile token: slow under full-suite load.
    test.setTimeout(90_000);
    await openContact(page);
    // Five attempts are allowed (invalid ones count too, so nothing is sent).
    for (let i = 0; i < 5; i++) {
      await fill(page, { email: "pat@example" });
      await send(page);
      await expect(page.locator("#contact-form-status [role=alert]")).toContainText(
        "fix the highlighted fields",
      );
      await expect(page.locator('input[name="cf-turnstile-response"]')).toHaveValue(/.+/, {
        timeout: 15_000,
      });
    }
    await fill(page);
    await send(page);
    await expect(page.locator("#contact-form-status [role=alert]")).toContainText(
      "Too many messages",
    );
  });
});

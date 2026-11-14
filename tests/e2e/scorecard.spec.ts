import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test, type Page } from "@playwright/test";

/**
 * First Step Scorecard, end to end, at every viewport. Runs against the
 * production build with Cloudflare's always-pass Turnstile test keys and
 * EMAIL_TRANSPORT=outbox. Each test uses its own IP and email address, so
 * tests can run in parallel and still find their own emails in the outbox.
 */

const outbox = join(process.cwd(), ".outbox");

interface OutboxMessage {
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
}

function outboxFor(address: string): OutboxMessage[] {
  try {
    return readdirSync(outbox)
      .filter((f) => f.endsWith(".json"))
      .map((f) => JSON.parse(readFileSync(join(outbox, f), "utf8")) as OutboxMessage)
      .filter((m) => m.to === address || m.replyTo === address);
  } catch {
    return [];
  }
}

const unique = () => Math.random().toString(36).slice(2, 10);

async function openScorecard(page: Page) {
  const octet = () => Math.floor(Math.random() * 250) + 1;
  await page.setExtraHTTPHeaders({ "x-real-ip": `10.${octet()}.${octet()}.${octet()}` });
  await page.goto("/scorecard");
  await expect(page.getByText("Question 1 of 12")).toBeVisible();
}

/** Answers every question with the answer at `index` (0 to 4). */
async function answerAll(page: Page, index: number) {
  for (let i = 1; i <= 12; i++) {
    await expect(page.getByText(`Question ${i} of 12`)).toBeVisible();
    await page.locator("main fieldset input[type=radio]").nth(index).check();
    await page.getByRole("button", { name: "Next" }).click();
  }
  await expect(
    page.getByRole("heading", { name: "Where should we send your results?" }),
  ).toBeFocused();
}

async function fillGate(page: Page, email: string, team = "No one in-house") {
  await page.locator("#field-firstName").fill("Pat");
  await page.locator("#field-email").fill(email);
  await page.locator("#field-company").fill("Example Co");
  await page.locator("#field-size").selectOption("10 to 49 people");
  await page.locator("#field-role").selectOption("Owner or founder");
  await page.locator("#field-team").selectOption(team);
  await page.locator("#field-consent").check();
  await expect(page.locator('input[name="cf-turnstile-response"]')).toHaveValue(/.+/, {
    timeout: 15_000,
  });
}

async function send(page: Page) {
  const done = page.waitForResponse(
    (r) => r.request().method() === "POST" && new URL(r.url()).pathname === "/scorecard",
  );
  await page.getByRole("button", { name: "Email me my results" }).click();
  await done;
}

test.describe("First Step Scorecard", () => {
  test("runs the full flow and emails the results", async ({ page }) => {
    const violations: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && /Content Security Policy/i.test(msg.text())) {
        violations.push(msg.text());
      }
    });
    await openScorecard(page);
    // The second answer everywhere is worth 1 point: 12 of 48.
    await answerAll(page, 1);
    const email = `pat-${unique()}@example.com`;
    await fillGate(page, email);
    await send(page);

    const result = page.getByTestId("scorecard-result");
    await expect(result).toBeVisible();
    await expect(page.getByRole("heading", { name: "Uneven ground" })).toBeFocused();
    await expect(result).toContainText("12 of 48");
    await expect(result.getByRole("heading", { name: "AI Safe Start" })).toBeVisible();
    await expect(result.getByRole("link", { name: "Book a free AI Fit Call" })).toHaveAttribute(
      "href",
      "/contact#book",
    );
    await expect(result.getByRole("link", { name: /Read about AI Safe Start/ })).toHaveAttribute(
      "href",
      "/services/safe-start",
    );

    // No answers in the URL, and nothing horizontal to scroll.
    expect(new URL(page.url()).search).toBe("");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      page.viewportSize()!.width,
    );

    const messages = outboxFor(email);
    const toVisitor = messages.find((m) => m.to === email);
    const toDavid = messages.find((m) => m.to === "david@sureground.tech");
    expect(toVisitor).toMatchObject({
      subject: "Your First Step Scorecard results",
      replyTo: "david@sureground.tech",
    });
    expect(toVisitor!.text).toContain("Uneven ground");
    expect(toVisitor!.text).not.toContain("Pat");
    expect(toVisitor!.text).not.toContain("Example Co");
    expect(toDavid).toMatchObject({ replyTo: email });
    expect(toDavid!.subject).toContain("Example Co");
    expect(violations).toEqual([]);

    // Results are not stored: a reload starts over.
    await page.reload();
    await expect(page.getByText("Question 1 of 12")).toBeVisible();
    await expect(page.getByTestId("scorecard-result")).toHaveCount(0);
  });

  test("an engineering team that builds with AI is pointed to Pilot Triage", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "360-light", "runs once");
    await openScorecard(page);
    // Every area ready would be a Pilot Sprint, but this team can build.
    await answerAll(page, 4);
    const email = `eng-${unique()}@example.com`;
    await fillGate(page, email, "An engineering team that already builds with AI");
    await send(page);
    const result = page.getByTestId("scorecard-result");
    await expect(result.getByRole("heading", { name: "AI Pilot Triage" })).toBeVisible();
    const toDavid = outboxFor(email).find((m) => m.to === "david@sureground.tech");
    expect(toDavid!.text).toContain(
      "Who builds AI: An engineering team that already builds with AI",
    );
    expect(toDavid!.text).toContain("Recommended: AI Pilot Triage");
  });

  test("needs an answer to move on, and Back keeps answers", async ({ page }) => {
    await openScorecard(page);
    const next = page.getByRole("button", { name: "Next" });
    await expect(next).toBeDisabled();
    await expect(page.getByRole("button", { name: "Back" })).toHaveCount(0);

    await page.locator("main fieldset input[type=radio]").nth(3).check();
    await next.click();
    await expect(page.getByText("Question 2 of 12")).toBeVisible();
    await expect(page.locator("main fieldset legend h2")).toBeFocused();

    await page.getByRole("button", { name: "Back" }).click();
    await expect(page.getByText("Question 1 of 12")).toBeVisible();
    await expect(page.locator("main fieldset input[type=radio]").nth(3)).toBeChecked();
  });

  test("answers with the keyboard", async ({ page }) => {
    await openScorecard(page);
    await page.locator("main fieldset input[type=radio]").first().focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("main fieldset input[type=radio]").nth(1)).toBeChecked();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Next" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByText("Question 2 of 12")).toBeVisible();
  });

  test("shows inline errors on the email gate and keeps what was typed", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "360-light", "runs once");
    await openScorecard(page);
    await answerAll(page, 2);
    await fillGate(page, "pat@example");
    await send(page);
    await expect(page.locator("#field-email")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#scorecard-status [role=alert]")).toContainText(
      "fix the highlighted fields",
    );
    await expect(page.locator("#field-company")).toHaveValue("Example Co");
    await expect(page.locator("#field-size")).toHaveValue("10 to 49 people");
    await expect(page.locator("#field-role")).toHaveValue("Owner or founder");
    await expect(page.locator("#field-team")).toHaveValue("No one in-house");
    await expect(page.locator("#field-consent")).toBeChecked();
  });

  test("arriving from the home page loads /scorecard with its own CSP", async ({ page }) => {
    await page.goto("/");
    const load = page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname === "/scorecard" && r.request().resourceType() === "document",
    );
    await page
      .getByRole("link", { name: /Take the First Step Scorecard/ })
      .first()
      .click();
    const response = await load;
    expect(response.headers()["content-security-policy"]).toContain(
      "https://challenges.cloudflare.com",
    );
    expect(response.headers()["content-security-policy"]).not.toContain("cal.com");
  });
});

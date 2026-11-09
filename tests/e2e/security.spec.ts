import { expect, test } from "@playwright/test";

test.describe("security baseline", () => {
  test("home page sends the security headers and a nonce CSP", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    const headers = response!.headers();

    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
    expect(headers["strict-transport-security"]).toBe("max-age=63072000; includeSubDomains");
    expect(headers["permissions-policy"]).toContain("camera=()");
    expect(headers["x-powered-by"]).toBeUndefined();

    const csp = headers["content-security-policy"];
    expect(csp).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toContain("unsafe-eval");
  });

  test("a fresh nonce on every request, applied to every script", async ({ page, request }) => {
    const nonceOf = (csp: string | undefined) => /'nonce-([^']+)'/.exec(csp ?? "")?.[1];
    const first = nonceOf((await request.get("/")).headers()["content-security-policy"]);
    const response = await page.goto("/");
    const second = nonceOf(response!.headers()["content-security-policy"]);
    expect(first).toBeTruthy();
    expect(second).not.toBe(first);

    const scripts = await page
      .locator("script")
      .evaluateAll((els) => els.map((el) => (el as HTMLScriptElement).nonce));
    expect(scripts.length).toBeGreaterThan(0);
    for (const nonce of scripts) expect(nonce).toBe(second);
  });

  test("the page runs with no CSP violations", async ({ page }) => {
    const violations: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && /Content Security Policy/i.test(msg.text())) {
        violations.push(msg.text());
      }
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(violations).toEqual([]);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("SureGround");
  });

  test("no horizontal scroll", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("static assets get the security headers too", async ({ request }) => {
    const response = await request.get("/favicon.ico");
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  });

  test("cross-site and Origin-less POSTs are rejected", async ({ request }) => {
    const crossSite = await request.post("/", {
      headers: { origin: "https://evil.example", "next-action": "x" },
      data: "",
    });
    expect(crossSite.status()).toBe(403);

    const noOrigin = await request.post("/", { headers: { "next-action": "x" }, data: "" });
    expect(noOrigin.status()).toBe(403);
    expect(noOrigin.headers()["x-frame-options"]).toBe("DENY");

    // A prefetch header must not let a POST skip the proxy.
    const prefetch = await request.post("/", {
      headers: { origin: "https://evil.example", "next-action": "x", "next-router-prefetch": "1" },
      data: "",
    });
    expect(prefetch.status()).toBe(403);
  });

  test("security.txt is published", async ({ request }) => {
    const response = await request.get("/.well-known/security.txt");
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toContain("Contact: mailto:david@sureground.tech");
    expect(text).toMatch(/Expires: /);
  });
});

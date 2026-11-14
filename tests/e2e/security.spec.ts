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

  // Pages with every kind of content so far: JSON-LD, next/image, the step
  // motif animation, tables.
  for (const path of [
    "/",
    "/services/pilot-sprint",
    "/pricing",
    "/about",
    "/contact",
    "/scorecard",
    "/blog",
    "/blog/google-ai-mode-home-services-booking",
  ]) {
    test(`${path} runs with no CSP violations`, async ({ page }) => {
      const violations: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error" && /Content Security Policy/i.test(msg.text())) {
          violations.push(msg.text());
        }
      });
      // Some violations never reach the console, such as a caught eval probe
      // (Zod's, before lib/zod.ts set jitless), so listen for the DOM event too.
      await page.addInitScript(() => {
        const seen: string[] = [];
        (window as unknown as { __cspViolations: string[] }).__cspViolations = seen;
        document.addEventListener("securitypolicyviolation", (e) =>
          seen.push(`${e.effectiveDirective} ${e.blockedURI} ${e.sourceFile}`),
        );
      });
      await page.goto(path);
      // Wait for hydration (the theme toggle marks itself ready), then a beat
      // for late scripts and styles. Not "networkidle": link prefetches for
      // pages that do not exist yet return 404 streams that never settle.
      await expect(page.locator("[data-theme-toggle][data-ready]").first()).toBeAttached();
      await page.waitForTimeout(500);
      expect(violations).toEqual([]);
      expect(
        await page.evaluate(
          () => (window as unknown as { __cspViolations: string[] }).__cspViolations,
        ),
      ).toEqual([]);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    });
  }

  test("no horizontal scroll", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("static assets get the security headers too", async ({ page, request }) => {
    // Build assets skip proxy.ts; next.config.ts headers() still covers them.
    await page.goto("/");
    const href = await page.locator('link[rel="stylesheet"]').first().getAttribute("href");
    expect(href).toMatch(/^\/_next\/static\//);
    const response = await request.get(href!);
    expect(response.status()).toBe(200);
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
    expect(response.headers()["x-frame-options"]).toBe("DENY");
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

  test("only sureground.tech may be indexed", async ({ request }) => {
    // localhost stands in for vercel.app and every other non-production host.
    const local = await request.get("/");
    expect(local.headers()["x-robots-tag"]).toBe("noindex, nofollow");
    const asset = await request.get("/.well-known/security.txt");
    expect(asset.headers()["x-robots-tag"]).toBe("noindex, nofollow");

    for (const host of ["sureground.tech", "www.sureground.tech"]) {
      const response = await request.get("/", { headers: { host } });
      expect(response.status(), host).toBe(200);
      expect(response.headers()["x-robots-tag"], host).toBeUndefined();
    }
  });

  test("security.txt is published", async ({ request }) => {
    const response = await request.get("/.well-known/security.txt");
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toContain("Contact: mailto:david@sureground.tech");
    expect(text).toMatch(/Expires: /);
  });
});

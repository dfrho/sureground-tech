import { describe, expect, it } from "vitest";

import {
  INDEXABLE_HOST,
  NOINDEX_VALUE,
  noindexRule,
  securityHeaders,
} from "@/lib/security/headers";

function asMap(dev: boolean) {
  return new Map(securityHeaders({ dev }).map((h) => [h.key, h.value]));
}

describe("securityHeaders", () => {
  const prod = asMap(false);

  it("sets the required production headers", () => {
    expect(prod.get("Strict-Transport-Security")).toBe("max-age=63072000; includeSubDomains");
    expect(prod.get("X-Content-Type-Options")).toBe("nosniff");
    expect(prod.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(prod.get("X-Frame-Options")).toBe("DENY");
    expect(prod.get("Cross-Origin-Opener-Policy")).toBe("same-origin");
  });

  it("denies camera, microphone, geolocation and browsing-topics", () => {
    const policy = prod.get("Permissions-Policy") ?? "";
    for (const feature of ["camera", "microphone", "geolocation", "browsing-topics"]) {
      expect(policy).toContain(`${feature}=()`);
    }
  });

  it("does not add HSTS preload until David confirms every subdomain", () => {
    expect(prod.get("Strict-Transport-Security")).not.toContain("preload");
  });

  it("omits HSTS in development", () => {
    expect(asMap(true).has("Strict-Transport-Security")).toBe(false);
  });
});

describe("noindexRule", () => {
  // Next.js anchors `has`/`missing` values: the whole host must match.
  const indexable = new RegExp(`^${INDEXABLE_HOST}$`);

  it("lets only the custom domain be indexed", () => {
    expect(indexable.test("sureground.tech")).toBe(true);
    expect(indexable.test("www.sureground.tech")).toBe(true);
  });

  it("marks every other host noindex", () => {
    for (const host of [
      "sureground-tech.vercel.app",
      "sureground-tech-euskpjb9x-david-rhodes-projects.vercel.app",
      "localhost:3100",
      "sureground.tech.evil.example",
      "evilsureground.tech",
      "sureground-tech",
    ]) {
      expect(indexable.test(host), host).toBe(false);
    }
  });

  it("applies X-Robots-Tag noindex when the host is not the custom domain", () => {
    const rule = noindexRule();
    expect(rule.source).toBe("/:path*");
    expect(rule.missing).toEqual([{ type: "host", value: INDEXABLE_HOST }]);
    expect(rule.headers).toEqual([{ key: "X-Robots-Tag", value: NOINDEX_VALUE }]);
    expect(NOINDEX_VALUE).toContain("noindex");
  });
});

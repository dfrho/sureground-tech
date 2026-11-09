import { describe, expect, it } from "vitest";

import { securityHeaders } from "@/lib/security/headers";

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

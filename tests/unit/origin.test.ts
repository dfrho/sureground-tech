import { describe, expect, it } from "vitest";

import { checkSameOrigin } from "@/lib/security/origin";

function h(init: Record<string, string>) {
  return new Headers(init);
}

describe("checkSameOrigin", () => {
  it("allows safe methods without an Origin", () => {
    expect(checkSameOrigin("GET", h({ host: "sureground.tech" })).ok).toBe(true);
    expect(checkSameOrigin("HEAD", h({})).ok).toBe(true);
  });

  it("allows a same-origin POST", () => {
    const headers = h({ host: "sureground.tech", origin: "https://sureground.tech" });
    expect(checkSameOrigin("POST", headers)).toEqual({ ok: true });
  });

  it("prefers x-forwarded-host, as set by Vercel", () => {
    const headers = h({
      host: "internal:3000",
      "x-forwarded-host": "sureground.tech",
      origin: "https://sureground.tech",
    });
    expect(checkSameOrigin("POST", headers).ok).toBe(true);
  });

  it("rejects a POST with no Origin (Next.js would only warn)", () => {
    expect(checkSameOrigin("POST", h({ host: "sureground.tech" }))).toEqual({
      ok: false,
      reason: "missing-origin",
    });
    expect(checkSameOrigin("POST", h({ host: "a", origin: "null" })).ok).toBe(false);
  });

  it("rejects a cross-site POST", () => {
    const headers = h({ host: "sureground.tech", origin: "https://evil.example" });
    expect(checkSameOrigin("POST", headers)).toEqual({ ok: false, reason: "origin-mismatch" });
  });

  it("rejects look-alike hosts and ports", () => {
    expect(
      checkSameOrigin(
        "POST",
        h({ host: "sureground.tech", origin: "https://sureground.tech.evil.example" }),
      ).ok,
    ).toBe(false);
    expect(
      checkSameOrigin(
        "POST",
        h({ host: "sureground.tech", origin: "https://sureground.tech:8443" }),
      ).ok,
    ).toBe(false);
  });

  it("rejects a malformed Origin", () => {
    expect(checkSameOrigin("PUT", h({ host: "a", origin: "not a url" }))).toEqual({
      ok: false,
      reason: "bad-origin",
    });
  });
});

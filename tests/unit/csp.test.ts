import { describe, expect, it } from "vitest";

import { buildCsp, createNonce, integrationSources } from "@/lib/security/csp";

const nonce = "AAAAAAAAAAAAAAAAAAAAAA==";

function directives(csp: string): Map<string, string[]> {
  return new Map(
    csp.split(";").map((part) => {
      const [name, ...sources] = part.trim().split(/\s+/);
      return [name, sources];
    }),
  );
}

describe("buildCsp (production)", () => {
  const csp = directives(buildCsp({ nonce }));

  it("allows scripts only by nonce with strict-dynamic", () => {
    expect(csp.get("script-src")).toEqual(["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"]);
  });

  it("never allows unsafe-eval or unsafe-inline scripts", () => {
    expect(csp.get("script-src")).not.toContain("'unsafe-eval'");
    expect(csp.get("script-src")).not.toContain("'unsafe-inline'");
    expect(csp.get("style-src")).not.toContain("'unsafe-inline'");
  });

  it("sets the required lockdown directives", () => {
    expect(csp.get("default-src")).toEqual(["'self'"]);
    expect(csp.get("object-src")).toEqual(["'none'"]);
    expect(csp.get("base-uri")).toEqual(["'self'"]);
    expect(csp.get("form-action")).toEqual(["'self'"]);
    expect(csp.get("frame-ancestors")).toEqual(["'none'"]);
    expect(csp.get("frame-src")).toEqual(["'none'"]);
    expect(csp.has("upgrade-insecure-requests")).toBe(true);
  });

  it("allows no third-party hosts by default", () => {
    expect(buildCsp({ nonce })).not.toMatch(/https:\/\//);
  });
});

describe("buildCsp (development)", () => {
  const csp = directives(buildCsp({ nonce, dev: true }));

  it("adds unsafe-eval for React dev tooling only", () => {
    expect(csp.get("script-src")).toContain("'unsafe-eval'");
  });

  it("skips upgrade-insecure-requests on http localhost", () => {
    expect(csp.has("upgrade-insecure-requests")).toBe(false);
  });
});

describe("buildCsp integrations", () => {
  it("adds Turnstile hosts and replaces frame-src 'none'", () => {
    const csp = directives(buildCsp({ nonce, integrations: ["turnstile"] }));
    expect(csp.get("script-src")).toContain("https://challenges.cloudflare.com");
    expect(csp.get("frame-src")).toEqual(["https://challenges.cloudflare.com"]);
  });

  it("adds Cal.com hosts", () => {
    const csp = directives(buildCsp({ nonce, integrations: ["cal"] }));
    for (const host of integrationSources.cal["frame-src"] ?? []) {
      expect(csp.get("frame-src")).toContain(host);
    }
  });

  it("does not duplicate sources", () => {
    const csp = directives(buildCsp({ nonce, integrations: ["turnstile", "turnstile"] }));
    const script = csp.get("script-src") ?? [];
    expect(new Set(script).size).toBe(script.length);
  });
});

describe("nonces", () => {
  it("rejects a nonce that could inject directives", () => {
    expect(() => buildCsp({ nonce: "abc'; script-src *" })).toThrow();
    expect(() => buildCsp({ nonce: "short" })).toThrow();
  });

  it("creates unique 128-bit base64 nonces", () => {
    const a = createNonce();
    const b = createNonce();
    expect(a).not.toBe(b);
    expect(atob(a)).toHaveLength(16);
    expect(() => buildCsp({ nonce: a })).not.toThrow();
  });
});

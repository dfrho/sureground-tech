import { afterEach, describe, expect, it, vi } from "vitest";

import { logSecurityEvent } from "@/lib/security/log";

describe("logSecurityEvent", () => {
  afterEach(() => vi.restoreAllMocks());

  it("writes structured JSON and drops fields outside the allow list", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    logSecurityEvent("honeypot_hit", {
      form: "contact",
      // Simulate a caller passing PII by mistake.
      ...({ email: "someone@example.com", ip: "203.0.113.9" } as object),
    });
    const line = String(spy.mock.calls[0][0]);
    const parsed = JSON.parse(line);
    expect(parsed).toMatchObject({ type: "security", event: "honeypot_hit", form: "contact" });
    expect(line).not.toContain("someone@example.com");
    expect(line).not.toContain("203.0.113.9");
  });
});

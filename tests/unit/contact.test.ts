import { render } from "@react-email/render";
import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";

import { ContactNotify, contactNotifySubject, contactNotifyText } from "@/emails/ContactNotify";
import { headerSafe } from "@/lib/email/send";
import {
  contactLimits,
  contactSchema,
  contactTopics,
  topicFromQuery,
  fieldNames,
  type ContactField,
  type ContactInput,
} from "@/lib/forms/contact-schema";
import { clientIp, hashKey } from "@/lib/forms/hash";
import { messages, runFormPipeline, type PipelineDeps } from "@/lib/forms/pipeline";
import { MAX_TOKEN_LENGTH, SITEVERIFY_URL, verifyTurnstile } from "@/lib/forms/turnstile";
import { createMemoryLimiter, limits, windowMs } from "@/lib/rate-limit";
import { alertThresholds, shouldAlert } from "@/lib/security/alert";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { buildCsp, integrationsForPath, needsFullPageLoad } from "@/lib/security/csp";

const valid = {
  name: "Pat Example",
  email: "pat@example.com",
  company: "Example Co",
  topic: "Services",
  message: "Hello.\nSecond line.",
};

describe("contactSchema", () => {
  it("accepts a valid message and trims values", () => {
    const r = contactSchema.safeParse({ ...valid, name: "  Pat  ", email: " pat@example.com " });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.name).toBe("Pat");
      expect(r.data.email).toBe("pat@example.com");
    }
  });

  it("treats company as optional", () => {
    const r = contactSchema.safeParse({ ...valid, company: undefined });
    expect(r.success && r.data.company).toBe("");
  });

  it("enforces every max length", () => {
    const cases: [ContactField, number][] = [
      ["name", contactLimits.name],
      ["company", contactLimits.company],
      ["message", contactLimits.message],
    ];
    for (const [field, max] of cases) {
      expect(contactSchema.safeParse({ ...valid, [field]: "a".repeat(max) }).success, field).toBe(
        true,
      );
      expect(
        contactSchema.safeParse({ ...valid, [field]: "a".repeat(max + 1) }).success,
        field,
      ).toBe(false);
    }
    const longEmail = `${"a".repeat(250)}@x.co`;
    expect(contactSchema.safeParse({ ...valid, email: longEmail }).success).toBe(false);
  });

  it("requires name, email, topic and message", () => {
    for (const field of ["name", "email", "topic", "message"] as const) {
      expect(contactSchema.safeParse({ ...valid, [field]: "" }).success, field).toBe(false);
      expect(contactSchema.safeParse({ ...valid, [field]: "   " }).success, field).toBe(false);
    }
  });

  it("accepts only the listed topics", () => {
    for (const topic of contactTopics) {
      expect(contactSchema.safeParse({ ...valid, topic }).success).toBe(true);
    }
    expect(contactSchema.safeParse({ ...valid, topic: "Billing" }).success).toBe(false);
  });

  it("rejects invalid and header-injecting email addresses", () => {
    for (const email of ["not-an-email", "a@b", "pat@example.com\r\nBcc: x@y.z", "a b@c.com"]) {
      expect(contactSchema.safeParse({ ...valid, email }).success, email).toBe(false);
    }
  });

  it("strips CR, LF and control characters from single-line fields", () => {
    const r = contactSchema.safeParse({ ...valid, name: "Pat\r\nBcc: x@y.z\u0000" });
    expect(r.success && r.data.name).toBe("Pat  Bcc: x@y.z");
  });

  it("keeps line breaks in the message but drops other control characters", () => {
    const r = contactSchema.safeParse({ ...valid, message: "One\r\nTwo\u0007" });
    expect(r.success && r.data.message).toBe("One\nTwo");
  });
});

describe("topicFromQuery", () => {
  it("includes Demo build in the topic list", () => {
    expect(contactTopics).toContain("Demo build");
  });

  it("presets only known slugs", () => {
    expect(topicFromQuery("demo-build")).toBe("Demo build");
    for (const value of [
      undefined,
      "",
      "Demo build",
      "DEMO-BUILD",
      "demo-build ",
      "other",
      "toString",
      "__proto__",
      "constructor",
      ["demo-build"],
      ["demo-build", "demo-build"],
      "x".repeat(5000),
    ]) {
      expect(topicFromQuery(value)).toBeUndefined();
    }
  });
});

describe("verifyTurnstile", () => {
  const ok = (body: object) =>
    vi.fn(
      async () => new Response(JSON.stringify(body), { status: 200 }),
    ) as unknown as typeof fetch;

  it("fails without a token or with an oversized one, without calling Cloudflare", async () => {
    const fetchImpl = ok({ success: true });
    expect(await verifyTurnstile({ secret: "s", token: null, fetchImpl })).toEqual({
      ok: false,
      reason: "missing-token",
    });
    expect(await verifyTurnstile({ secret: "s", token: "", fetchImpl })).toMatchObject({
      ok: false,
    });
    expect(
      await verifyTurnstile({ secret: "s", token: "x".repeat(MAX_TOKEN_LENGTH + 1), fetchImpl }),
    ).toEqual({ ok: false, reason: "token-too-long" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("posts the secret, token and IP to siteverify", async () => {
    const fetchImpl = ok({ success: true });
    await verifyTurnstile({ secret: "sec", token: "tok", remoteIp: "203.0.113.9", fetchImpl });
    const [url, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe(SITEVERIFY_URL);
    const body = init.body as URLSearchParams;
    expect(body.get("secret")).toBe("sec");
    expect(body.get("response")).toBe("tok");
    expect(body.get("remoteip")).toBe("203.0.113.9");
  });

  it("passes only on success: true", async () => {
    expect(
      await verifyTurnstile({ secret: "s", token: "t", fetchImpl: ok({ success: true }) }),
    ).toEqual({ ok: true });
    expect(
      await verifyTurnstile({ secret: "s", token: "t", fetchImpl: ok({ success: false }) }),
    ).toEqual({ ok: false, reason: "rejected" });
    expect(await verifyTurnstile({ secret: "s", token: "t", fetchImpl: ok({}) })).toEqual({
      ok: false,
      reason: "rejected",
    });
  });

  it("fails closed on network errors, timeouts and bad responses", async () => {
    const throws = vi.fn(async () => {
      throw new Error("network");
    }) as unknown as typeof fetch;
    expect(await verifyTurnstile({ secret: "s", token: "t", fetchImpl: throws })).toEqual({
      ok: false,
      reason: "unavailable",
    });
    const slow = ((_: unknown, init: RequestInit) =>
      new Promise((_, reject) =>
        init.signal?.addEventListener("abort", () => reject(new Error("abort"))),
      )) as unknown as typeof fetch;
    expect(
      await verifyTurnstile({ secret: "s", token: "t", fetchImpl: slow, timeoutMs: 20 }),
    ).toEqual({ ok: false, reason: "unavailable" });
    const status500 = vi.fn(
      async () => new Response("", { status: 500 }),
    ) as unknown as typeof fetch;
    expect(await verifyTurnstile({ secret: "s", token: "t", fetchImpl: status500 })).toMatchObject({
      ok: false,
    });
    const notJson = vi.fn(
      async () => new Response("<html>", { status: 200 }),
    ) as unknown as typeof fetch;
    expect(await verifyTurnstile({ secret: "s", token: "t", fetchImpl: notJson })).toMatchObject({
      ok: false,
    });
  });

  it("checks the hostname when expected hostnames are given", async () => {
    const hosts = ["sureground.tech"];
    expect(
      await verifyTurnstile({
        secret: "s",
        token: "t",
        expectedHostnames: hosts,
        fetchImpl: ok({ success: true, hostname: "evil.example" }),
      }),
    ).toEqual({ ok: false, reason: "bad-hostname" });
    expect(
      await verifyTurnstile({
        secret: "s",
        token: "t",
        expectedHostnames: hosts,
        fetchImpl: ok({ success: true, hostname: "sureground.tech" }),
      }),
    ).toEqual({ ok: true });
  });
});

describe("rate-limit keys", () => {
  it("hashes with the salt and never contains the raw value", () => {
    const a = hashKey("ip", "203.0.113.9", "salt-one");
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toContain("203.0.113.9");
    expect(hashKey("ip", "203.0.113.9", "salt-one")).toBe(a);
    expect(hashKey("ip", "203.0.113.9", "salt-two")).not.toBe(a);
  });

  it("normalizes email case and keeps ip and email keys apart", () => {
    expect(hashKey("email", "Pat@Example.com ", "s")).toBe(
      hashKey("email", "pat@example.com", "s"),
    );
    expect(hashKey("email", "x", "s")).not.toBe(hashKey("ip", "x", "s"));
    // One key per inbox: plus tags share the base address's limit.
    expect(hashKey("email", "Pat+1@example.com", "s")).toBe(
      hashKey("email", "pat@example.com", "s"),
    );
    expect(hashKey("email", "pat+a+b@example.com", "s")).toBe(
      hashKey("email", "pat@example.com", "s"),
    );
    expect(hashKey("email", "+x@example.com", "s")).not.toBe(
      hashKey("email", "x@example.com", "s"),
    );
  });

  it("reads the client IP from the platform headers", () => {
    expect(clientIp(new Headers({ "x-real-ip": "203.0.113.9" }))).toBe("203.0.113.9");
    expect(clientIp(new Headers({ "x-forwarded-for": "198.51.100.1, 10.0.0.1" }))).toBe(
      "198.51.100.1",
    );
    expect(clientIp(new Headers())).toBe("unknown");
  });
});

describe("memory rate limiter", () => {
  it("allows 5 contact messages per IP per hour, then blocks until the window slides", () => {
    let now = 0;
    const allow = createMemoryLimiter(() => now);
    expect(limits["contact:ip"]).toEqual({ tokens: 5, window: "1 h" });
    for (let i = 0; i < 5; i++) expect(allow("contact:ip", "k")).toBe(true);
    expect(allow("contact:ip", "k")).toBe(false);
    expect(allow("contact:ip", "other")).toBe(true);
    now = windowMs("1 h") + 1;
    expect(allow("contact:ip", "k")).toBe(true);
  });
});

function form(values: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) fd.set(k, v);
  return fd;
}

const fields = ["name", "email", "company", "topic", "message"] as const;

function setup(
  overrides: Partial<PipelineDeps> = {},
  send: (d: ContactInput) => Promise<boolean> = async () => true,
) {
  const calls: string[] = [];
  const events: string[] = [];
  const deps: PipelineDeps = {
    verifyTurnstile: vi.fn(async () => {
      calls.push("turnstile");
      return { ok: true } as const;
    }),
    allow: vi.fn(async () => {
      calls.push("limit");
      return true;
    }),
    onSecurityEvent: (e) => {
      events.push(e);
    },
    ...overrides,
  };
  const run = (values: Record<string, string>) =>
    runFormPipeline({
      form: "contact",
      formData: form(values),
      schema: contactSchema,
      fields,
      limits: [{ bucket: "contact:ip", key: "hashed" }],
      deps,
      send: async (d) => {
        calls.push("send");
        return send(d);
      },
    });
  return { run, calls, events, send };
}

const good = { ...valid, [fieldNames.turnstile]: "token" };

describe("runFormPipeline", () => {
  it("runs Turnstile, rate limit and send in order and reports success", async () => {
    const { run, calls, events } = setup();
    expect(await run(good)).toEqual({ status: "success" });
    expect(calls).toEqual(["turnstile", "limit", "send"]);
    expect(events).toEqual([]);
  });

  it("stops at a failed Turnstile check", async () => {
    const { run, calls, events } = setup({
      verifyTurnstile: async () => ({ ok: false, reason: "rejected" }),
    });
    const r = await run(good);
    expect(r).toMatchObject({ status: "error", message: messages.turnstile });
    expect(calls).toEqual([]);
    expect(events).toEqual(["turnstile_failed"]);
  });

  it("rejects honeypot hits without a false success and without sending", async () => {
    const { run, calls, events } = setup();
    const r = await run({ ...good, [fieldNames.honeypot]: "http://spam.example" });
    expect(r.status).toBe("error");
    expect(calls).toEqual(["turnstile"]);
    expect(events).toEqual(["honeypot_hit"]);
  });

  it("blocks when over the rate limit", async () => {
    const { run, calls, events } = setup({ allow: async () => false });
    expect(await run(good)).toMatchObject({ status: "error", message: messages.rateLimited });
    expect(calls).not.toContain("send");
    expect(events).toEqual(["rate_limited"]);
  });

  it("fails closed when the limiter errors", async () => {
    const { run, calls } = setup({
      allow: async () => {
        throw new Error("redis down");
      },
    });
    expect(await run(good)).toMatchObject({ status: "error", message: messages.generic });
    expect(calls).not.toContain("send");
  });

  it("returns inline field errors and the visitor's values on invalid input", async () => {
    const { run, calls } = setup();
    const r = await run({ ...good, email: "nope", topic: "Billing" });
    expect(r.status).toBe("error");
    if (r.status === "error") {
      expect(r.message).toBe(messages.invalid);
      expect(Object.keys(r.fieldErrors ?? {}).sort()).toEqual(["email", "topic"]);
      expect(r.values?.name).toBe(valid.name);
    }
    expect(calls).not.toContain("send");
  });

  it("never claims success when the email fails", async () => {
    const { run, events } = setup(
      {},
      vi.fn(async () => false),
    );
    expect(await run(good)).toMatchObject({ status: "error", message: messages.sendFailed });
    expect(events).toEqual(["email_send_failed"]);
  });

  it("never claims success when the send step throws", async () => {
    const { run } = setup(
      {},
      vi.fn(async () => {
        throw new Error("boom");
      }),
    );
    expect((await run(good)).status).toBe("error");
  });
});

describe("ContactNotify email", () => {
  const data: ContactInput = {
    name: '<script>alert("x")</script>',
    email: "pat@example.com",
    company: "",
    topic: "Other",
    message: "<img src=x onerror=alert(1)>\nline two",
  };

  it("renders visitor input as escaped text", async () => {
    const html = await render(createElement(ContactNotify, { data }));
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("SureGround Tech, Nashville, TN");
    expect(html).toContain("/legal/privacy");
  });

  it("has a plain-text part with the footer and no HTML", () => {
    const text = contactNotifyText({ ...data, name: "Pat", message: "Hi" });
    expect(text).toContain("Name: Pat");
    expect(text).toContain("Company: Not given");
    expect(text).toContain("SureGround Tech, Nashville, TN");
  });

  it("produces a header-safe subject", () => {
    const subject = headerSafe(contactNotifySubject({ ...data, name: "Pat\r\nBcc: x@y.z" }));
    expect(subject).not.toMatch(/[\r\n]/);
    expect(headerSafe("x".repeat(500)).length).toBe(200);
  });
});

describe("security alerts", () => {
  it("alerts once per hour when a threshold is reached", () => {
    const t = alertThresholds.email_send_failed!;
    expect(shouldAlert("email_send_failed", t - 1)).toBe(false);
    expect(shouldAlert("email_send_failed", t)).toBe(true);
    expect(shouldAlert("email_send_failed", t + 1)).toBe(false);
    expect(shouldAlert("honeypot_hit", 1000)).toBe(false);
    expect(alertThresholds.rate_limited).toBeGreaterThan(0);
  });
});

describe("CSP for Phase 4 integrations", () => {
  const nonce = "AAAAAAAAAAAAAAAAAAAAAA==";
  const contact = buildCsp({ nonce, integrations: integrationsForPath("/contact") });
  const home = buildCsp({ nonce, integrations: integrationsForPath("/") });

  it("allows Turnstile and Cal.com only on /contact", () => {
    expect(integrationsForPath("/contact")).toEqual(["turnstile", "cal"]);
    expect(integrationsForPath("/contact/")).toEqual(["turnstile", "cal"]);
    expect(integrationsForPath("/")).toEqual([]);
    expect(integrationsForPath("/about")).toEqual([]);
    expect(contact).toContain("frame-src https://challenges.cloudflare.com https://app.cal.com");
    expect(home).not.toMatch(/https:\/\//);
  });

  it("keeps scripts on the nonce everywhere and relaxes styles only for the Cal embed", () => {
    expect(contact).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
    expect(contact).toContain("style-src 'self' 'unsafe-inline'");
    expect(home).toContain(`style-src 'self' 'nonce-${nonce}'`);
    expect(contact).not.toContain("'unsafe-eval'");
    expect(contact).not.toMatch(/https:\/\/\*/);
    expect(contact).toContain("frame-ancestors 'none'");
  });

  it("marks links to /contact and /scorecard as full page loads", () => {
    expect(needsFullPageLoad("/contact")).toBe(true);
    expect(needsFullPageLoad("/contact#book")).toBe(true);
    expect(needsFullPageLoad("/contact?x=1")).toBe(true);
    expect(needsFullPageLoad("/scorecard")).toBe(true);
    expect(needsFullPageLoad("/services")).toBe(false);
    expect(needsFullPageLoad("/")).toBe(false);
  });

  it("no next/link points at a page with its own CSP", () => {
    const files = (dir: string): string[] =>
      readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        return statSync(path).isDirectory() ? files(path) : /\.tsx?$/.test(name) ? [path] : [];
      });
    const offending = ["app", "components"]
      .flatMap((d) => files(join(process.cwd(), d)))
      .filter((f) => /<Link[^>]*href=["{`]*\/(contact|scorecard)/.test(readFileSync(f, "utf8")));
    expect(offending).toEqual([]);
  });
});

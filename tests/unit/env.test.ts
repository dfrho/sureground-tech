import { describe, expect, it } from "vitest";

import { describeEnvIssues, productionRequired, serverEnvSchema } from "@/lib/env.schema";

const full = {
  NEXT_PUBLIC_SITE_URL: "https://sureground.tech",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "site-key",
  NEXT_PUBLIC_CAL_LINK: "sureground/ai-fit-call",
  CONTACT_TO_EMAIL: "david@sureground.tech",
  EMAIL_FROM: "SureGround <hello@send.sureground.tech>",
  EMAIL_TRANSPORT: "resend",
  RESEND_API_KEY: "re_test",
  TURNSTILE_SECRET_KEY: "secret",
  UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: "token",
  RATE_LIMIT_SALT: "x".repeat(32),
};

describe("serverEnvSchema", () => {
  it("accepts a complete production environment", () => {
    expect(serverEnvSchema("production").safeParse(full).success).toBe(true);
  });

  it("fails production when any required variable is missing", () => {
    for (const key of productionRequired) {
      const env: Record<string, string> = { ...full };
      delete env[key];
      expect(serverEnvSchema("production").safeParse(env).success, key).toBe(false);
    }
  });

  it("rejects the outbox transport in production", () => {
    const env = { ...full, EMAIL_TRANSPORT: "outbox" };
    expect(serverEnvSchema("production").safeParse(env).success).toBe(false);
  });

  it("allows outbox without Resend in development", () => {
    const env = {
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      CONTACT_TO_EMAIL: "david@sureground.tech",
      EMAIL_FROM: "SureGround <hello@send.sureground.tech>",
      EMAIL_TRANSPORT: "outbox",
    };
    expect(serverEnvSchema("development").safeParse(env).success).toBe(true);
  });

  it("requires a Resend key whenever transport is resend", () => {
    const env: Record<string, string> = { ...full };
    delete env.RESEND_API_KEY;
    expect(serverEnvSchema("development").safeParse(env).success).toBe(false);
  });

  it("never includes values in error messages", () => {
    const result = serverEnvSchema("production").safeParse({ ...full, RATE_LIMIT_SALT: "s3cr3t" });
    expect(result.success).toBe(false);
    if (!result.success) expect(describeEnvIssues(result.error)).not.toContain("s3cr3t");
  });
});

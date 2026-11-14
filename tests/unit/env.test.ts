import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  describeEnvIssues,
  enabledFeatures,
  featureEnv,
  requiredInProduction,
  serverEnvSchema,
  withEnvAliases,
  type Feature,
} from "@/lib/env.schema";

const full = {
  NEXT_PUBLIC_SITE_URL: "https://sureground.tech",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "site-key",
  NEXT_PUBLIC_CAL_LINK: "sureground/ai-fit-call",
  CONTACT_TO_EMAIL: "david@sureground.tech",
  EMAIL_FROM: "SureGround Tech <hello@send.sureground.tech>",
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
    for (const key of requiredInProduction()) {
      const env: Record<string, string> = { ...full };
      delete env[key];
      expect(serverEnvSchema("production").safeParse(env).success, key).toBe(false);
    }
  });

  it("requires every feature group once it is enabled", () => {
    const all = Object.keys(featureEnv) as Feature[];
    for (const key of requiredInProduction(all)) {
      const env: Record<string, string> = { ...full };
      delete env[key];
      expect(serverEnvSchema("production", all).safeParse(env).success, key).toBe(false);
    }
  });

  it("does not require variables for features that are not built yet", () => {
    const env: Record<string, string> = { ...full };
    for (const f of Object.keys(featureEnv) as Feature[]) {
      if (enabledFeatures.includes(f)) continue;
      for (const key of featureEnv[f]) delete env[key];
    }
    expect(serverEnvSchema("production").safeParse(env).success).toBe(true);
  });

  it("reports every missing variable in one run", () => {
    const result = serverEnvSchema("production").safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const reported = new Set(result.error.issues.map((i) => String(i.path[0])));
      for (const key of requiredInProduction()) expect(reported.has(key), key).toBe(true);
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
      EMAIL_FROM: "SureGround Tech <hello@send.sureground.tech>",
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

/** Source files that ship, minus the env modules that declare every variable. */
function shippedSources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return shippedSources(path);
    return /\.(ts|tsx|mdx)$/.test(name) ? [path] : [];
  });
}

describe("feature gating", () => {
  it("no code uses a variable whose feature is not enabled", () => {
    const files = ["app", "components", "lib", "emails", "content"]
      .flatMap((d) => {
        try {
          return shippedSources(join(process.cwd(), d));
        } catch {
          return [];
        }
      })
      .filter((f) => !/\/lib\/env(\.schema|\.public)?\.ts$/.test(f));
    const offending: string[] = [];
    for (const f of Object.keys(featureEnv) as Feature[]) {
      if (enabledFeatures.includes(f)) continue;
      for (const key of featureEnv[f]) {
        for (const file of files) {
          if (readFileSync(file, "utf8").includes(key)) {
            offending.push(`${key} in ${file.replace(process.cwd() + "/", "")} (enable "${f}")`);
          }
        }
      }
    }
    expect(offending).toEqual([]);
  });
});

describe("withEnvAliases", () => {
  it("accepts the Vercel Marketplace KV_* names for Upstash", () => {
    const env: Record<string, string> = { ...full };
    delete env.UPSTASH_REDIS_REST_URL;
    delete env.UPSTASH_REDIS_REST_TOKEN;
    env.KV_REST_API_URL = "https://example.upstash.io";
    env.KV_REST_API_TOKEN = "token";
    expect(serverEnvSchema("production").safeParse(env).success).toBe(false);
    expect(serverEnvSchema("production").safeParse(withEnvAliases(env)).success).toBe(true);
  });

  it("prefers UPSTASH_* when both are set", () => {
    const out = withEnvAliases({ UPSTASH_REDIS_REST_URL: "a", KV_REST_API_URL: "b" });
    expect(out.UPSTASH_REDIS_REST_URL).toBe("a");
  });
});

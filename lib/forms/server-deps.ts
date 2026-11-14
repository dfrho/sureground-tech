import "server-only";

import { headers } from "next/headers";

import { site } from "@/lib/config/site";
import { getServerEnv } from "@/lib/env";
import { allow, type LimitBucket } from "@/lib/rate-limit";
import { reportSecurityEvent } from "@/lib/security/alert";

import { clientIp, hashKey } from "./hash";
import type { FormName, PipelineDeps } from "./pipeline";
import { verifyTurnstile } from "./turnstile";

// Used only for local runs without Upstash, when RATE_LIMIT_SALT is unset.
// This repository is public, so this value is not secret.
const DEV_SALT = "development-only-salt-not-secret-0000";

/**
 * The real pipeline dependencies for a form's Server Action: Turnstile,
 * Upstash limits and security event reporting, plus the salted key helper.
 */
export async function formContext(form: FormName, path: string) {
  const env = getServerEnv();
  const ip = clientIp(await headers());
  // The public dev salt is only for the in-memory limiter. Hashes that go to
  // Upstash always use the secret salt (audit OWASP-A04-001).
  if (!env.RATE_LIMIT_SALT && (env.UPSTASH_REDIS_REST_URL || process.env.VERCEL_ENV)) {
    throw new Error("RATE_LIMIT_SALT is required");
  }
  const salt = env.RATE_LIMIT_SALT ?? DEV_SALT;
  const production = process.env.VERCEL_ENV === "production";

  const deps: PipelineDeps = {
    verifyTurnstile: (token) =>
      env.TURNSTILE_SECRET_KEY
        ? verifyTurnstile({
            secret: env.TURNSTILE_SECRET_KEY,
            token,
            remoteIp: ip === "unknown" ? undefined : ip,
            expectedHostnames: production ? site.productionHosts : undefined,
          })
        : Promise.resolve({ ok: false, reason: "unavailable" }),
    allow: (bucket, key) => allow(bucket as LimitBucket, key),
    onSecurityEvent: (event, reason) => reportSecurityEvent(event, { form, path, reason }),
  };

  return {
    env,
    deps,
    key: (kind: "ip" | "email", value: string) => hashKey(kind, value, salt),
    ip,
  };
}

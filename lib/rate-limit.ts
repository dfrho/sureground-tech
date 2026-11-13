import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { getServerEnv } from "@/lib/env";

/**
 * Rate limits for the forms, backed by Upstash Redis. Keys are salted
 * SHA-256 hashes (lib/forms/hash.ts), never raw IPs or email addresses.
 *
 * Fails closed: a Redis error throws (the pipeline turns that into an error
 * message) and a timeout counts as blocked. Without Upstash configured, a
 * per-process memory limiter is used outside production only.
 */

type Window = `${number} ${"s" | "m" | "h" | "d"}`;

export const limits = {
  /** 5 messages per IP per hour (CLAUDE.md, A06). */
  "contact:ip": { tokens: 5, window: "1 h" },
  /** Scorecard (Phase 5): 5 per IP per 10 minutes, 3 per email hash per day. */
  "scorecard:ip": { tokens: 5, window: "10 m" },
  "scorecard:email": { tokens: 3, window: "1 d" },
} as const satisfies Record<string, { tokens: number; window: Window }>;

export type LimitBucket = keyof typeof limits;

let redis: Redis | null | undefined;
const limiters = new Map<LimitBucket, Ratelimit>();

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  const env = getServerEnv();
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN });
  } else if (process.env.VERCEL_ENV === "production") {
    throw new Error("Upstash is required in production");
  } else {
    redis = null;
  }
  return redis;
}

export function windowMs(window: Window): number {
  const [n, unit] = window.split(" ") as [string, "s" | "m" | "h" | "d"];
  const mult = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit];
  return Number(n) * mult;
}

/** Sliding-log limiter for development and tests. Not shared across processes. */
export function createMemoryLimiter(now: () => number = Date.now) {
  const hits = new Map<string, number[]>();
  return (bucket: LimitBucket, key: string): boolean => {
    const { tokens, window } = limits[bucket];
    const since = now() - windowMs(window);
    const id = `${bucket}:${key}`;
    const recent = (hits.get(id) ?? []).filter((t) => t > since);
    if (recent.length >= tokens) {
      hits.set(id, recent);
      return false;
    }
    recent.push(now());
    hits.set(id, recent);
    return true;
  };
}

const memory = createMemoryLimiter();

export async function allow(bucket: LimitBucket, key: string): Promise<boolean> {
  const client = getRedis();
  if (!client) return memory(bucket, key);

  let limiter = limiters.get(bucket);
  if (!limiter) {
    const { tokens, window } = limits[bucket];
    limiter = new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(tokens, window),
      prefix: `rl:${bucket}`,
      // The library allows requests when Redis is slow; 0 turns that off.
      timeout: 0,
      analytics: false,
    });
    limiters.set(bucket, limiter);
  }
  const result = await limiter.limit(key);
  return result.success && result.reason !== "timeout";
}

/**
 * Counts an event in the current hour and returns the new count. Used for
 * the spike alert. Returns 0 when Upstash is not configured.
 */
export async function countThisHour(name: string): Promise<number> {
  const client = getRedis();
  if (!client) return 0;
  const hour = new Date().toISOString().slice(0, 13);
  const key = `alert:${name}:${hour}`;
  const count = await client.incr(key);
  if (count === 1) await client.expire(key, 2 * 60 * 60);
  return count;
}

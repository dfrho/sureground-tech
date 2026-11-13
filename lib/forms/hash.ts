import { createHash } from "node:crypto";

/**
 * Salted SHA-256 for rate-limit keys (A04). The salt is server-side
 * (RATE_LIMIT_SALT), so a key cannot be reversed to an IP or email by
 * hashing guesses without it. Emails are lowercased first.
 */
export function hashKey(kind: "ip" | "email", value: string, salt: string): string {
  const normalized = kind === "email" ? value.trim().toLowerCase() : value.trim();
  return createHash("sha256").update(`${salt}:${kind}:${normalized}`).digest("hex");
}

/**
 * The client IP. On Vercel, x-real-ip and x-forwarded-for are set by the
 * platform and cannot be spoofed by the visitor. Locally they may be absent.
 */
export function clientIp(headers: Headers): string {
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "unknown";
}

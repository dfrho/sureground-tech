import { createHash } from "node:crypto";

/**
 * Salted SHA-256 for rate-limit keys (A04). The salt is server-side
 * (RATE_LIMIT_SALT), so a key cannot be reversed to an IP or email by
 * hashing guesses without it. Emails are normalized first (normalizeEmail).
 */
export function hashKey(kind: "ip" | "email", value: string, salt: string): string {
  const normalized = kind === "email" ? normalizeEmail(value) : value.trim();
  return createHash("sha256").update(`${salt}:${kind}:${normalized}`).digest("hex");
}

/**
 * One rate-limit key per inbox: lowercased, with any "+tag" removed from the
 * local part, so pat+1@ and pat+2@ share pat@'s limit (audit OWASP-A06-001).
 */
export function normalizeEmail(value: string): string {
  const email = value.trim().toLowerCase();
  const at = email.lastIndexOf("@");
  if (at < 1) return email;
  const local = email.slice(0, at).split("+")[0] || email.slice(0, at);
  return `${local}${email.slice(at)}`;
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

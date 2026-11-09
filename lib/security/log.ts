/**
 * Structured security event logging (A09). Fields are restricted to a fixed
 * set of non-identifying keys so names, email addresses, message bodies and
 * raw IPs can never be logged through this helper.
 */

export type SecurityEvent =
  | "origin_rejected"
  | "turnstile_failed"
  | "honeypot_hit"
  | "rate_limited"
  | "validation_failed"
  | "email_send_failed";

export interface SecurityEventFields {
  path?: string;
  method?: string;
  reason?: string;
  form?: "contact" | "scorecard";
}

const ALLOWED_KEYS = new Set<keyof SecurityEventFields>(["path", "method", "reason", "form"]);

export function logSecurityEvent(event: SecurityEvent, fields: SecurityEventFields = {}): void {
  const safe: Record<string, string> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (ALLOWED_KEYS.has(key as keyof SecurityEventFields) && typeof value === "string") {
      safe[key] = value.slice(0, 200);
    }
  }
  console.warn(JSON.stringify({ type: "security", event, ...safe, at: new Date().toISOString() }));
}

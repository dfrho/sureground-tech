/**
 * Same-origin check for state-changing requests (Server Actions and form
 * posts). Next.js already compares Origin to Host for Server Actions, but it
 * lets requests with no Origin header through with a warning. This check
 * fails closed: a POST without a matching Origin is rejected.
 */

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export type OriginVerdict =
  | { ok: true }
  | { ok: false; reason: "missing-origin" | "bad-origin" | "origin-mismatch" | "missing-host" };

export function checkSameOrigin(method: string, headers: Headers): OriginVerdict {
  if (SAFE_METHODS.has(method.toUpperCase())) return { ok: true };

  const origin = headers.get("origin");
  if (!origin || origin === "null") return { ok: false, reason: "missing-origin" };

  let originHost: string;
  try {
    originHost = new URL(origin).host.toLowerCase();
  } catch {
    return { ok: false, reason: "bad-origin" };
  }

  // Vercel sets x-forwarded-host itself; locally only host is present.
  const host = (headers.get("x-forwarded-host") ?? headers.get("host"))
    ?.split(",")[0]
    ?.trim()
    .toLowerCase();
  if (!host) return { ok: false, reason: "missing-host" };

  return originHost === host ? { ok: true } : { ok: false, reason: "origin-mismatch" };
}

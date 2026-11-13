/**
 * Cloudflare Turnstile server-side verification. Fails closed: a missing or
 * oversized token, a network error, a timeout or any non-success answer is a
 * failure. Pure apart from the injected fetch, so it is unit tested.
 */

export const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
export const MAX_TOKEN_LENGTH = 2048;

export type TurnstileVerdict =
  | { ok: true }
  | {
      ok: false;
      reason: "missing-token" | "token-too-long" | "rejected" | "bad-hostname" | "unavailable";
    };

export interface VerifyOptions {
  secret: string;
  token: unknown;
  remoteIp?: string;
  /** When set, the hostname Cloudflare reports must be one of these. */
  expectedHostnames?: readonly string[];
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export async function verifyTurnstile({
  secret,
  token,
  remoteIp,
  expectedHostnames,
  fetchImpl = fetch,
  timeoutMs = 5000,
}: VerifyOptions): Promise<TurnstileVerdict> {
  if (typeof token !== "string" || token.length === 0)
    return { ok: false, reason: "missing-token" };
  if (token.length > MAX_TOKEN_LENGTH) return { ok: false, reason: "token-too-long" };

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  let data: { success?: unknown; hostname?: unknown };
  try {
    const res = await fetchImpl(SITEVERIFY_URL, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, reason: "unavailable" };
    data = (await res.json()) as typeof data;
  } catch {
    return { ok: false, reason: "unavailable" };
  }

  if (data.success !== true) return { ok: false, reason: "rejected" };
  if (
    expectedHostnames &&
    (typeof data.hostname !== "string" || !expectedHostnames.includes(data.hostname))
  ) {
    return { ok: false, reason: "bad-hostname" };
  }
  return { ok: true };
}

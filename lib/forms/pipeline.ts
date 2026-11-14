import type { z } from "@/lib/zod";

import type { SecurityEvent } from "@/lib/security/log";

import { fieldNames, type FormState } from "./contact-schema";
import type { TurnstileVerdict } from "./turnstile";

/**
 * The shared form pipeline (contact form now, the Scorecard in Phase 5):
 * Turnstile, honeypot, rate limits, Zod, then the form's own send step.
 * Every dependency is injected so the order and the fail-closed behavior are
 * unit tested without network calls.
 */

export type FormName = "contact" | "scorecard";

export interface PipelineDeps {
  verifyTurnstile(token: unknown): Promise<TurnstileVerdict>;
  /** Returns false when the key is over its limit, and throws on limiter errors. */
  allow(bucket: string, key: string): Promise<boolean>;
  onSecurityEvent(event: SecurityEvent, reason?: string): void | Promise<void>;
}

export interface RateLimitKey {
  /** Limiter bucket, for example "contact:ip". */
  bucket: string;
  /** Already hashed with the server-side salt. Never a raw IP or email. */
  key: string;
}

export const messages = {
  generic: "Something went wrong and your message was not sent. Please try again in a minute.",
  turnstile: "Please complete the security check, then send again.",
  rateLimited: "Too many messages from your connection. Please try again later, or email instead.",
  invalid: "Please fix the highlighted fields.",
  sendFailed: "Your message could not be sent right now. Please try again, or email instead.",
} as const;

export interface PipelineInput<S extends z.ZodType<Record<string, unknown>>> {
  form: FormName;
  formData: FormData;
  schema: S;
  fields: readonly (keyof z.output<S> & string)[];
  /** Limits checked before validation. Keys for later limits (email hash) come from `lateLimits`. */
  limits: RateLimitKey[];
  lateLimits?: (data: z.output<S>) => Promise<RateLimitKey[]>;
  deps: PipelineDeps;
  /** Per-form wording for the error messages. */
  messages?: Partial<Record<keyof typeof messages, string>>;
  /** Sends the email(s). Returns false on failure; the pipeline never claims success then. */
  send(data: z.output<S>): Promise<boolean>;
}

export async function runFormPipeline<S extends z.ZodType<Record<string, unknown>>>(
  input: PipelineInput<S>,
): Promise<FormState<keyof z.output<S> & string>> {
  type F = keyof z.output<S> & string;
  const { formData, schema, fields, deps } = input;
  const text = { ...messages, ...input.messages };

  const values: Partial<Record<F, string>> = {};
  for (const f of fields) {
    const v = formData.get(f);
    if (typeof v === "string") values[f] = v.slice(0, 4000);
  }
  const fail = (message: string, extra: { fieldErrors?: Partial<Record<F, string>> } = {}) =>
    ({ status: "error", message, values, ...extra }) as const;

  try {
    // 1. Turnstile (fails closed on errors and timeouts).
    const verdict = await deps.verifyTurnstile(formData.get(fieldNames.turnstile));
    if (!verdict.ok) {
      await deps.onSecurityEvent("turnstile_failed", verdict.reason);
      return fail(text.turnstile);
    }

    // 2. Honeypot: a hidden field people never see. No false success for bots either.
    const trap = formData.get(fieldNames.honeypot);
    if (typeof trap === "string" && trap.length > 0) {
      await deps.onSecurityEvent("honeypot_hit");
      return fail(text.generic);
    }

    // 3. Rate limits by salted hash.
    for (const { bucket, key } of input.limits) {
      if (!(await deps.allow(bucket, key))) {
        await deps.onSecurityEvent("rate_limited", bucket);
        return fail(text.rateLimited);
      }
    }

    // 4. Validation.
    const raw: Record<string, unknown> = {};
    for (const f of fields) {
      const v = formData.get(f);
      raw[f] = typeof v === "string" ? v : undefined;
    }
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<F, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !(key in fieldErrors)) fieldErrors[key as F] = issue.message;
      }
      await deps.onSecurityEvent("validation_failed", Object.keys(fieldErrors).join(","));
      return fail(text.invalid, { fieldErrors });
    }

    if (input.lateLimits) {
      for (const { bucket, key } of await input.lateLimits(parsed.data)) {
        if (!(await deps.allow(bucket, key))) {
          await deps.onSecurityEvent("rate_limited", bucket);
          return fail(text.rateLimited);
        }
      }
    }

    // 5. Send. Only a confirmed send is a success.
    if (!(await input.send(parsed.data))) {
      await deps.onSecurityEvent("email_send_failed");
      return fail(text.sendFailed);
    }
    return { status: "success" };
  } catch {
    // Limiter or other infrastructure errors: fail closed with no details.
    await Promise.resolve(deps.onSecurityEvent("form_error")).catch(() => {});
    return fail(text.generic);
  }
}

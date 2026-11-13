import { z } from "zod";

/**
 * Environment schemas. Pure module (no "server-only") so build scripts and
 * unit tests can import it. Application code imports lib/env.ts or
 * lib/env.public.ts instead.
 */

const nonEmpty = z.string().trim().min(1);

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url({ protocol: /^https?$/ }),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: nonEmpty.optional(),
  NEXT_PUBLIC_CAL_LINK: z
    .string()
    .regex(/^[a-z0-9-]+\/[a-z0-9-]+$/i, "Use the form team/event")
    .optional(),
});

const serverShape = z.object({
  CONTACT_TO_EMAIL: z.email(),
  EMAIL_FROM: nonEmpty,
  EMAIL_TRANSPORT: z.enum(["resend", "outbox"]),
  RESEND_API_KEY: nonEmpty.optional(),
  TURNSTILE_SECRET_KEY: nonEmpty.optional(),
  UPSTASH_REDIS_REST_URL: z.url({ protocol: /^https$/ }).optional(),
  UPSTASH_REDIS_REST_TOKEN: nonEmpty.optional(),
  RATE_LIMIT_SALT: z.string().min(32, "Use at least 32 random characters").optional(),
});

/**
 * Variables each feature needs. A production build requires only the groups
 * in `enabledFeatures`, so the list grows with the site: the phase that ships
 * a feature adds its group there. tests/unit/env.test.ts fails if code uses a
 * variable from a group that is not enabled.
 */
export const featureEnv = {
  /** Canonical URLs and metadata. */
  core: ["NEXT_PUBLIC_SITE_URL"],
  /** Sending email through Resend (contact form and Scorecard). */
  email: ["CONTACT_TO_EMAIL", "EMAIL_FROM", "EMAIL_TRANSPORT", "RESEND_API_KEY"],
  /** Form protection: Turnstile, and Upstash rate limits keyed by salted hashes. Phase 4. */
  forms: [
    "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
    "TURNSTILE_SECRET_KEY",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "RATE_LIMIT_SALT",
  ],
  /** Cal.com booking embed for the AI Fit Call. Phase 4. */
  booking: ["NEXT_PUBLIC_CAL_LINK"],
} as const;

export type Feature = keyof typeof featureEnv;
type EnvKey = (typeof featureEnv)[Feature][number];

/** Features the site ships today. Phase 4 added "forms" and "booking". */
export const enabledFeatures: readonly Feature[] = ["core", "email", "forms", "booking"];

/** Variables a production deployment cannot run without. */
export function requiredInProduction(features: readonly Feature[] = enabledFeatures): EnvKey[] {
  return features.flatMap((f) => featureEnv[f]);
}

export function serverEnvSchema(
  mode: "production" | "development",
  features: readonly Feature[] = enabledFeatures,
) {
  const base = serverShape.extend(publicEnvSchema.shape);
  // In production the required variables become non-optional, so a single
  // parse reports every missing one together with any malformed value.
  const shape =
    mode === "production"
      ? base.required(
          Object.fromEntries(requiredInProduction(features).map((k) => [k, true])) as {
            [K in EnvKey]?: true;
          },
        )
      : base;
  return shape.superRefine((env, ctx) => {
    if (env.EMAIL_TRANSPORT === "resend" && !env.RESEND_API_KEY) {
      ctx.addIssue({
        code: "custom",
        path: ["RESEND_API_KEY"],
        message: "Required when EMAIL_TRANSPORT=resend",
      });
    }
    if (mode === "production" && env.EMAIL_TRANSPORT !== "resend") {
      ctx.addIssue({
        code: "custom",
        path: ["EMAIL_TRANSPORT"],
        message: "Production must send with resend",
      });
    }
  });
}

export type ServerEnv = z.infer<ReturnType<typeof serverEnvSchema>>;

/** Formats issues by variable name only. Never prints values. */
export function describeEnvIssues(error: z.ZodError): string {
  return error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n");
}

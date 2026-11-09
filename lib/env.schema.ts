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

/** Variables a production deployment cannot run without. */
export const productionRequired = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "NEXT_PUBLIC_CAL_LINK",
  "CONTACT_TO_EMAIL",
  "EMAIL_FROM",
  "EMAIL_TRANSPORT",
  "RESEND_API_KEY",
  "TURNSTILE_SECRET_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "RATE_LIMIT_SALT",
] as const;

export function serverEnvSchema(mode: "production" | "development") {
  return serverShape.merge(publicEnvSchema).superRefine((env, ctx) => {
    if (env.EMAIL_TRANSPORT === "resend" && !env.RESEND_API_KEY) {
      ctx.addIssue({
        code: "custom",
        path: ["RESEND_API_KEY"],
        message: "Required when EMAIL_TRANSPORT=resend",
      });
    }
    if (mode === "production") {
      if (env.EMAIL_TRANSPORT !== "resend") {
        ctx.addIssue({
          code: "custom",
          path: ["EMAIL_TRANSPORT"],
          message: "Production must send with resend",
        });
      }
      for (const key of productionRequired) {
        if (!env[key]) {
          ctx.addIssue({ code: "custom", path: [key], message: "Required in production" });
        }
      }
    }
  });
}

export type ServerEnv = z.infer<ReturnType<typeof serverEnvSchema>>;

/** Formats issues by variable name only. Never prints values. */
export function describeEnvIssues(error: z.ZodError): string {
  return error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n");
}

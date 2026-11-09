import { publicEnvSchema } from "./env.schema";

/**
 * Browser-safe environment. Only NEXT_PUBLIC_* values, each read by its full
 * name so Next.js can inline it at build time.
 */
export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || undefined,
  NEXT_PUBLIC_CAL_LINK: process.env.NEXT_PUBLIC_CAL_LINK || undefined,
});

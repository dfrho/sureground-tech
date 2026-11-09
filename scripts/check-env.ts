/**
 * Validates environment variables before `next build`.
 * On Vercel production builds (VERCEL_ENV=production) every required
 * variable must be present or the build fails. Elsewhere it validates only
 * what is set. Prints variable names, never values.
 */
import { describeEnvIssues, publicEnvSchema, serverEnvSchema } from "../lib/env.schema";

const production = process.env.VERCEL_ENV === "production";

const result = production
  ? serverEnvSchema("production").safeParse(process.env)
  : publicEnvSchema.partial().safeParse(process.env);

if (!result.success) {
  console.error(`check-env failed:\n${describeEnvIssues(result.error)}`);
  process.exit(1);
}
console.log(`check-env passed (${production ? "production" : "non-production"} rules).`);

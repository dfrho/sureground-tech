import "server-only";

import { describeEnvIssues, serverEnvSchema, type ServerEnv } from "./env.schema";

let cached: ServerEnv | undefined;

/**
 * Validated server environment. Import only from server code; the
 * "server-only" import makes a client bundle that reaches this file fail.
 */
export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const mode = process.env.VERCEL_ENV === "production" ? "production" : "development";
  const result = serverEnvSchema(mode).safeParse(process.env);
  if (!result.success) {
    throw new Error(`Invalid server environment:\n${describeEnvIssues(result.error)}`);
  }
  cached = result.data;
  return cached;
}

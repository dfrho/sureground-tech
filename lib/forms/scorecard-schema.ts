import { z } from "zod";

import { companySizes, questions, roles, type QuestionId } from "@/content/scorecard";

import { stripControl, type FormState } from "./contact-schema";

/**
 * Scorecard email gate and answers. Every answer must be one of its
 * question's answer ids; the server looks up the points (lib/scorecard/score.ts).
 */

export const scorecardLimits = {
  firstName: 80,
  email: 254,
  company: 120,
} as const;

const text = (max: number, label: string) =>
  z
    .string({ error: `Enter ${label}.` })
    .transform(stripControl)
    .pipe(z.string().min(1, `Enter ${label}.`).max(max, `Keep ${label} under ${max} characters.`));

const answerShape = Object.fromEntries(
  questions.map((q) => [
    q.id,
    z.enum(q.answers.map((a) => a.id) as [string, ...string[]], { error: "Answer this question." }),
  ]),
) as Record<QuestionId, z.ZodEnum<Record<string, string>>>;

const gateSchema = z.object({
  firstName: text(scorecardLimits.firstName, "your first name"),
  email: z
    .string({ error: "Enter your work email." })
    .trim()
    .max(scorecardLimits.email, "That email address is too long.")
    .pipe(z.email("Enter a valid email address, like name@company.com.")),
  company: text(scorecardLimits.company, "your company name"),
  size: z.enum(companySizes, { error: "Pick your company size." }),
  role: z.enum(roles, { error: "Pick your role." }),
  consent: z.literal("yes", { error: "Tick the box so we can email your results." }),
});

export type ScorecardInput = z.output<typeof gateSchema> & Record<QuestionId, string>;

/** The gate fields plus one answer id per question, all required. */
export const scorecardSchema = gateSchema.extend(answerShape) as unknown as z.ZodType<
  ScorecardInput,
  Record<string, unknown>
>;

export const questionIds = questions.map((q) => q.id) as QuestionId[];
export const gateFields = ["firstName", "email", "company", "size", "role", "consent"] as const;
export type GateField = (typeof gateFields)[number];
export type ScorecardField = QuestionId | GateField;
export const scorecardFields: readonly ScorecardField[] = [...questionIds, ...gateFields];

/** Scorecard wording for the shared pipeline's errors. */
export const scorecardMessages = {
  generic: "Something went wrong and your results were not sent. Please try again in a minute.",
  turnstile: "Please complete the security check, then try again.",
  rateLimited: "Too many tries from your connection or for this email. Please try again later.",
  invalid: "Please fix the highlighted fields.",
  sendFailed: "Your results could not be emailed right now. Please try again in a minute.",
} as const;

/** What the results screen shows. Built on the server; plain data only. */
export interface ScorecardOutcome {
  total: number;
  max: number;
  band: { name: string; summary: string };
  dimensions: { label: string; score: number; max: number }[];
  observations: string[];
  recommendation: {
    name: string;
    summary: string;
    price: string;
    href: string;
    reason: string;
  };
  disclaimer: string;
}

export type ScorecardFormState =
  | Exclude<FormState<ScorecardField>, { status: "success" }>
  | { status: "success"; outcome: ScorecardOutcome };

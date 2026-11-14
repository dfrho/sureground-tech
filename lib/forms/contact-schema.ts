import { z } from "@/lib/zod";

/**
 * Contact form fields, limits and validation. Shared by the form (for
 * maxLength and the topic list) and the server action (the source of truth).
 */

export const contactTopics = [
  "Fit Call question",
  "Services",
  "Demo build",
  "Speaking or workshop",
  "Other",
] as const;
export type ContactTopic = (typeof contactTopics)[number];

/**
 * Topics a link may preset with `/contact?topic=<slug>`. Only these exact
 * slugs count; anything else is ignored and the visitor picks a topic.
 */
const topicPresets: Readonly<Record<string, ContactTopic>> = {
  "demo-build": "Demo build",
};

/** The topic a `?topic=` query value presets, or undefined if it is not a known slug. */
export function topicFromQuery(value: string | string[] | undefined): ContactTopic | undefined {
  if (typeof value !== "string") return undefined;
  return Object.hasOwn(topicPresets, value) ? topicPresets[value] : undefined;
}

export const contactLimits = {
  name: 80,
  email: 254,
  company: 120,
  message: 2000,
} as const;

/** Removes control characters (including CR and LF) and trims. */
export function stripControl(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
}

/** Like stripControl but keeps line breaks, for multi-line message bodies. */
function stripControlKeepLines(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, " ")
    .trim();
}

const text = (max: number, label: string) =>
  z
    .string({ error: `Enter ${label}.` })
    .transform(stripControl)
    .pipe(z.string().min(1, `Enter ${label}.`).max(max, `Keep ${label} under ${max} characters.`));

export const contactSchema = z.object({
  name: text(contactLimits.name, "your name"),
  email: z
    .string({ error: "Enter your email address." })
    .trim()
    .max(contactLimits.email, "That email address is too long.")
    .pipe(z.email("Enter a valid email address, like name@company.com.")),
  company: z
    .string()
    .optional()
    .transform((v) => (v ? stripControl(v) : ""))
    .pipe(
      z
        .string()
        .max(contactLimits.company, `Keep the company under ${contactLimits.company} characters.`),
    ),
  topic: z.enum(contactTopics, { error: "Pick a topic." }),
  message: z
    .string({ error: "Enter a message." })
    .transform(stripControlKeepLines)
    .pipe(
      z
        .string()
        .min(1, "Enter a message.")
        .max(contactLimits.message, `Keep the message under ${contactLimits.message} characters.`),
    ),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type ContactField = keyof ContactInput;

/** Form field names. The honeypot has a plausible name so bots fill it. */
export const fieldNames = {
  honeypot: "website",
  turnstile: "cf-turnstile-response",
} as const;

export type FormState<F extends string> =
  | { status: "idle" }
  | { status: "success" }
  | {
      status: "error";
      message: string;
      fieldErrors?: Partial<Record<F, string>>;
      /** The visitor's own input, echoed back only to them so the form keeps it. */
      values?: Partial<Record<F, string>>;
    };

export type ContactFormState = FormState<ContactField>;

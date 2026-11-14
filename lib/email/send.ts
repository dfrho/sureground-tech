import "server-only";

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { render } from "@react-email/render";
import type { ReactElement } from "react";
import { Resend } from "resend";

import { getServerEnv } from "@/lib/env";
import { stripControl } from "@/lib/forms/contact-schema";

/**
 * The only place that calls Resend. With EMAIL_TRANSPORT=outbox (development
 * and tests only; production rejects it), rendered emails are written to
 * .outbox/ instead of sent. Returns false on any failure and never throws,
 * so callers cannot claim a send that did not happen.
 */

export interface OutgoingEmail {
  to: string;
  subject: string;
  /** Only an address that passed Zod email validation. */
  replyTo?: string;
  react: ReactElement;
  text: string;
}

let resend: Resend | undefined;

/** Strips CR, LF and other control characters from header values (A05). */
export function headerSafe(value: string, max = 200): string {
  return stripControl(value).slice(0, max);
}

export async function sendEmail(email: OutgoingEmail): Promise<boolean> {
  try {
    const env = getServerEnv();
    const subject = headerSafe(email.subject);
    const html = await render(email.react);

    if (env.EMAIL_TRANSPORT === "outbox") {
      const dir = join(process.cwd(), ".outbox");
      await mkdir(dir, { recursive: true });
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await writeFile(join(dir, `${id}.html`), html);
      await writeFile(
        join(dir, `${id}.json`),
        JSON.stringify(
          { from: env.EMAIL_FROM, to: email.to, replyTo: email.replyTo, subject, text: email.text },
          null,
          2,
        ),
      );
      return true;
    }

    if (!env.RESEND_API_KEY) return false;
    resend ??= new Resend(env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: email.to,
      subject,
      html,
      text: email.text,
      ...(email.replyTo ? { replyTo: headerSafe(email.replyTo, 254) } : {}),
    });
    if (error) logResendError(error.name);
    return !error;
  } catch {
    logResendError("exception");
    return false;
  }
}

/**
 * Logs why Resend refused a send, as its error code only (for example
 * "validation_error"). Resend's message can include the recipient address,
 * so it is never logged.
 */
function logResendError(code: unknown): void {
  const safe = typeof code === "string" && /^[a-z_]{1,50}$/.test(code) ? code : "unknown";
  console.warn(JSON.stringify({ type: "email", event: "resend_error", code: safe }));
}

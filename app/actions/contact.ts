"use server";

import { headers } from "next/headers";
import { createElement } from "react";

import { ContactNotify, contactNotifySubject, contactNotifyText } from "@/emails/ContactNotify";
import { site } from "@/lib/config/site";
import { sendEmail } from "@/lib/email/send";
import { getServerEnv } from "@/lib/env";
import {
  contactSchema,
  type ContactField,
  type ContactFormState,
} from "@/lib/forms/contact-schema";
import { clientIp, hashKey } from "@/lib/forms/hash";
import { messages, runFormPipeline } from "@/lib/forms/pipeline";
import { verifyTurnstile } from "@/lib/forms/turnstile";
import { allow, type LimitBucket } from "@/lib/rate-limit";
import { reportSecurityEvent } from "@/lib/security/alert";
import { logSecurityEvent } from "@/lib/security/log";

const fields: readonly ContactField[] = ["name", "email", "company", "topic", "message"];

// Used only for local runs without Upstash, when RATE_LIMIT_SALT is unset.
// This repository is public, so this value is not secret.
const DEV_SALT = "development-only-salt-not-secret-0000";

/**
 * Contact form Server Action. Runs the shared pipeline, then emails
 * ContactNotify to CONTACT_TO_EMAIL with reply-to set to the visitor's
 * validated address. No auto-reply to the visitor.
 */
export async function submitContact(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  try {
    return await handle(formData);
  } catch {
    // Configuration or infrastructure errors: fail closed, no details.
    logSecurityEvent("form_error", { form: "contact", path: "/contact" });
    const values: Partial<Record<ContactField, string>> = {};
    for (const f of fields) {
      const v = formData.get(f);
      if (typeof v === "string") values[f] = v.slice(0, 4000);
    }
    return { status: "error", message: messages.generic, values };
  }
}

async function handle(formData: FormData): Promise<ContactFormState> {
  const env = getServerEnv();
  const ip = clientIp(await headers());
  // The public dev salt is only for the in-memory limiter. Hashes that go to
  // Upstash always use the secret salt (audit OWASP-A04-001).
  if (!env.RATE_LIMIT_SALT && (env.UPSTASH_REDIS_REST_URL || process.env.VERCEL_ENV)) {
    throw new Error("RATE_LIMIT_SALT is required");
  }
  const salt = env.RATE_LIMIT_SALT ?? DEV_SALT;
  const production = process.env.VERCEL_ENV === "production";

  return runFormPipeline({
    form: "contact",
    formData,
    schema: contactSchema,
    fields,
    limits: [{ bucket: "contact:ip", key: hashKey("ip", ip, salt) }],
    deps: {
      verifyTurnstile: (token) =>
        env.TURNSTILE_SECRET_KEY
          ? verifyTurnstile({
              secret: env.TURNSTILE_SECRET_KEY,
              token,
              remoteIp: ip === "unknown" ? undefined : ip,
              expectedHostnames: production ? site.productionHosts : undefined,
            })
          : Promise.resolve({ ok: false, reason: "unavailable" }),
      allow: (bucket, key) => allow(bucket as LimitBucket, key),
      onSecurityEvent: (event, reason) =>
        reportSecurityEvent(event, { form: "contact", path: "/contact", reason }),
    },
    send: (data) =>
      sendEmail({
        to: env.CONTACT_TO_EMAIL,
        replyTo: data.email,
        subject: contactNotifySubject(data),
        react: createElement(ContactNotify, { data }),
        text: contactNotifyText(data),
      }),
  });
}

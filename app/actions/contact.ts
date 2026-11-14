"use server";

import { createElement } from "react";

import { ContactNotify, contactNotifySubject, contactNotifyText } from "@/emails/ContactNotify";
import { sendEmail } from "@/lib/email/send";
import {
  contactSchema,
  type ContactField,
  type ContactFormState,
} from "@/lib/forms/contact-schema";
import { messages, runFormPipeline } from "@/lib/forms/pipeline";
import { formContext } from "@/lib/forms/server-deps";
import { logSecurityEvent } from "@/lib/security/log";

const fields: readonly ContactField[] = ["name", "email", "company", "topic", "message"];

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
  const { env, deps, key, ip } = await formContext("contact", "/contact");

  return runFormPipeline({
    form: "contact",
    formData,
    schema: contactSchema,
    fields,
    limits: [{ bucket: "contact:ip", key: key("ip", ip) }],
    deps,
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

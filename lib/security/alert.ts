import "server-only";

import { createElement } from "react";

import { EmailLayout, emailFooterText } from "@/emails/layout";
import { sendEmail } from "@/lib/email/send";
import { getServerEnv } from "@/lib/env";
import { countThisHour } from "@/lib/rate-limit";

import { logSecurityEvent, type SecurityEvent, type SecurityEventFields } from "./log";

/**
 * Logs a security event and, for the events that matter, counts it per hour
 * in Upstash. When a count reaches its threshold, David gets one alert email
 * for that hour (A09). The alert has fixed text only, no visitor data.
 */
export const alertThresholds: Partial<Record<SecurityEvent, number>> = {
  rate_limited: 20,
  email_send_failed: 3,
  form_error: 3,
};

export function shouldAlert(event: SecurityEvent, count: number): boolean {
  const threshold = alertThresholds[event];
  return threshold !== undefined && count === threshold;
}

export async function reportSecurityEvent(
  event: SecurityEvent,
  fields: SecurityEventFields = {},
): Promise<void> {
  logSecurityEvent(event, fields);
  if (alertThresholds[event] === undefined) return;
  try {
    const count = await countThisHour(event);
    if (!shouldAlert(event, count)) return;
    const body = `The site logged ${count} "${event}" events in the last hour. Check the Vercel logs (type "security").`;
    await sendEmail({
      to: getServerEnv().CONTACT_TO_EMAIL,
      subject: `Site alert: ${event} spike`,
      react: createElement(EmailLayout, { preview: body }, body),
      text: `${body}\n\n${emailFooterText()}`,
    });
  } catch {
    // Alerting must never break the form response.
  }
}

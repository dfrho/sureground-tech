"use server";

import { createElement } from "react";

import {
  ScorecardLeadNotify,
  scorecardLeadSubject,
  scorecardLeadText,
} from "@/emails/ScorecardLeadNotify";
import {
  ScorecardResult,
  scorecardResultSubject,
  scorecardResultText,
} from "@/emails/ScorecardResult";
import { site } from "@/lib/config/site";
import { sendEmail } from "@/lib/email/send";
import { runFormPipeline } from "@/lib/forms/pipeline";
import {
  scorecardFields,
  scorecardMessages,
  scorecardSchema,
  type ScorecardField,
  type ScorecardFormState,
  type ScorecardOutcome,
} from "@/lib/forms/scorecard-schema";
import { formContext } from "@/lib/forms/server-deps";
import { present } from "@/lib/scorecard/present";
import { score } from "@/lib/scorecard/score";
import { logSecurityEvent } from "@/lib/security/log";

/**
 * First Step Scorecard Server Action. Runs the shared pipeline (Turnstile,
 * honeypot, rate limits by IP and by email hash, Zod), recomputes the score
 * from the answer ids, emails the lead to David and the results to the
 * visitor, then returns the results for display. Nothing is stored.
 */
export async function submitScorecard(
  _prev: ScorecardFormState,
  formData: FormData,
): Promise<ScorecardFormState> {
  try {
    return await handle(formData);
  } catch {
    logSecurityEvent("form_error", { form: "scorecard", path: "/scorecard" });
    return { status: "error", message: scorecardMessages.generic, values: echo(formData) };
  }
}

function echo(formData: FormData): Partial<Record<ScorecardField, string>> {
  const values: Partial<Record<ScorecardField, string>> = {};
  for (const f of scorecardFields) {
    const v = formData.get(f);
    if (typeof v === "string") values[f] = v.slice(0, 4000);
  }
  return values;
}

async function handle(formData: FormData): Promise<ScorecardFormState> {
  const { env, deps, key, ip } = await formContext("scorecard", "/scorecard");
  let outcome: ScorecardOutcome | undefined;

  const state = await runFormPipeline({
    form: "scorecard",
    formData,
    schema: scorecardSchema,
    fields: scorecardFields,
    limits: [{ bucket: "scorecard:ip", key: key("ip", ip) }],
    lateLimits: async (data) => [{ bucket: "scorecard:email", key: key("email", data.email) }],
    deps,
    messages: scorecardMessages,
    send: async (data) => {
      // The server's own score from the answer ids. The browser never sends one.
      const result = present(score(data));
      // Lead first: if it fails, nothing has gone to the visitor and a retry
      // is clean. Both must succeed before the visitor sees a success.
      const lead = await sendEmail({
        to: env.CONTACT_TO_EMAIL,
        replyTo: data.email,
        subject: scorecardLeadSubject(data, result),
        react: createElement(ScorecardLeadNotify, { data, outcome: result }),
        text: scorecardLeadText(data, result),
      });
      if (!lead) return false;
      // Fixed text and the score only (abuse rule): nothing the visitor typed.
      const sent = await sendEmail({
        to: data.email,
        replyTo: site.contactEmail,
        subject: scorecardResultSubject,
        react: createElement(ScorecardResult, { outcome: result }),
        text: scorecardResultText(result),
      });
      if (sent) outcome = result;
      return sent;
    },
  });

  if (state.status === "success") {
    if (!outcome) throw new Error("Scorecard sent without an outcome");
    return { status: "success", outcome };
  }
  return state;
}

"use client";

import { useCallback, useState } from "react";

import { CheckboxField, Honeypot, SelectField, TextField } from "@/components/forms/fields";
import { Turnstile } from "@/components/forms/Turnstile";
import { buttonClass } from "@/components/site/Button";
import { companySizes, roles, teamQuestion, teams } from "@/content/scorecard";
import { fieldNames } from "@/lib/forms/contact-schema";
import {
  questionIds,
  scorecardLimits,
  type ScorecardFormState,
} from "@/lib/forms/scorecard-schema";

/**
 * The email gate: who to send the results to, plus the answers as hidden
 * inputs. Turnstile and the honeypot protect it like the contact form.
 *
 * COPY: draft
 */
export function EmailGate({
  action,
  pending,
  state,
  answers,
  siteKey,
  email,
  headingRef,
  onBack,
}: {
  action: (formData: FormData) => void;
  pending: boolean;
  state: ScorecardFormState;
  answers: Record<string, string>;
  siteKey?: string;
  email: string;
  headingRef: React.Ref<HTMLHeadingElement>;
  onBack: () => void;
}) {
  const [widgetFailed, setWidgetFailed] = useState(false);
  const onWidgetError = useCallback(() => setWidgetFailed(true), []);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const values = state.status === "error" ? (state.values ?? {}) : {};
  const missingAnswers = questionIds.some((id) => id in errors);

  return (
    <form
      action={action}
      className="relative flex flex-col gap-5"
      aria-describedby="scorecard-status"
    >
      <div>
        <h2 ref={headingRef} tabIndex={-1} className="font-display text-h3 outline-none">
          Where should we send your results?
        </h2>
        <p className="mt-2 max-w-2xl text-muted">
          Your results go to your inbox and show on the next screen. David also gets a copy of your
          answers to follow up. This site keeps no copy.
        </p>
      </div>

      <div id="scorecard-status" aria-live="polite">
        {state.status === "error" ? (
          <p
            className="rounded-button border-2 border-text px-4 py-3 text-small font-semibold"
            role="alert"
          >
            {missingAnswers
              ? "Some answers were missing. Go back and answer every question, then try again."
              : state.message}
          </p>
        ) : null}
      </div>

      {questionIds.map((id) => (
        <input key={id} type="hidden" name={id} value={answers[id] ?? ""} />
      ))}

      <TextField
        name="firstName"
        label="First name"
        autoComplete="given-name"
        maxLength={scorecardLimits.firstName}
        error={errors.firstName}
        defaultValue={values.firstName}
      />
      <TextField
        name="email"
        label="Work email"
        type="email"
        autoComplete="email"
        maxLength={scorecardLimits.email}
        error={errors.email}
        defaultValue={values.email}
      />
      <TextField
        name="company"
        label="Company name"
        autoComplete="organization"
        maxLength={scorecardLimits.company}
        error={errors.company}
        defaultValue={values.company}
      />
      <SelectField
        name="size"
        label="Company size"
        options={companySizes}
        error={errors.size}
        defaultValue={values.size}
      />
      <SelectField
        name="role"
        label="Your role"
        options={roles}
        error={errors.role}
        defaultValue={values.role}
      />
      <SelectField
        name="team"
        label={teamQuestion}
        options={teams}
        error={errors.team}
        defaultValue={values.team}
      />
      <CheckboxField
        name="consent"
        label="Email me my results."
        error={errors.consent}
        defaultChecked={values.consent === "yes"}
      />
      <Honeypot name={fieldNames.honeypot} />

      {siteKey ? <Turnstile siteKey={siteKey} resetKey={state} onError={onWidgetError} /> : null}
      {!siteKey || widgetFailed ? (
        <p className="text-small text-muted">
          The security check could not load. You can email{" "}
          <a href={`mailto:${email}`} className="text-accent-text underline underline-offset-2">
            {email}
          </a>{" "}
          instead, or try again later.
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <button type="button" onClick={onBack} className={buttonClass("secondary")}>
          Back
        </button>
        <button
          type="submit"
          disabled={pending}
          className={buttonClass("primary", "disabled:opacity-60")}
        >
          {pending ? "Sending..." : "Email me my results"}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";

import { submitContact } from "@/app/actions/contact";
import { buttonClass } from "@/components/site/Button";
import {
  contactLimits,
  contactTopics,
  fieldNames,
  type ContactFormState,
} from "@/lib/forms/contact-schema";

import { Honeypot, SelectField, TextArea, TextField } from "./fields";
import { Turnstile } from "./Turnstile";

const idle: ContactFormState = { status: "idle" };

export function ContactForm({ siteKey, email }: { siteKey?: string; email: string }) {
  const [state, action, pending] = useActionState(submitContact, idle);
  const [widgetFailed, setWidgetFailed] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const onWidgetError = useCallback(() => setWidgetFailed(true), []);

  // Move focus to the result so keyboard and screen reader users hear it.
  useEffect(() => {
    if (state.status !== "idle") statusRef.current?.focus();
  }, [state]);

  if (state.status === "success") {
    return (
      <div
        ref={statusRef}
        tabIndex={-1}
        role="status"
        className="rounded-card border border-border bg-surface p-6"
        data-testid="contact-success"
      >
        {/* COPY: draft */}
        <p className="font-display text-h3">Message sent.</p>
        <p className="mt-2 text-muted">
          Thanks for writing. David will reply to the email address you gave.
        </p>
      </div>
    );
  }

  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const values = state.status === "error" ? (state.values ?? {}) : {};

  return (
    <form
      action={action}
      noValidate={false}
      className="relative flex flex-col gap-5"
      aria-describedby="contact-form-status"
    >
      <div id="contact-form-status" ref={statusRef} tabIndex={-1} aria-live="polite">
        {state.status === "error" ? (
          <p
            className="rounded-button border-2 border-text px-4 py-3 text-small font-semibold"
            role="alert"
          >
            {state.message}
          </p>
        ) : null}
      </div>

      <TextField
        name="name"
        label="Name"
        autoComplete="name"
        maxLength={contactLimits.name}
        error={errors.name}
        defaultValue={values.name}
      />
      <TextField
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        maxLength={contactLimits.email}
        error={errors.email}
        defaultValue={values.email}
      />
      <TextField
        name="company"
        label="Company"
        optional
        autoComplete="organization"
        maxLength={contactLimits.company}
        error={errors.company}
        defaultValue={values.company}
      />
      <SelectField
        name="topic"
        label="Topic"
        options={contactTopics}
        error={errors.topic}
        defaultValue={values.topic}
      />
      <TextArea
        name="message"
        label="Message"
        hint={`Up to ${contactLimits.message.toLocaleString("en-US")} characters.`}
        maxLength={contactLimits.message}
        error={errors.message}
        defaultValue={values.message}
      />
      <Honeypot name={fieldNames.honeypot} />

      {siteKey ? <Turnstile siteKey={siteKey} resetKey={state} onError={onWidgetError} /> : null}
      {!siteKey || widgetFailed ? (
        <p className="text-small text-muted">
          The security check could not load. You can email{" "}
          <a href={`mailto:${email}`} className="text-accent-text underline underline-offset-2">
            {email}
          </a>{" "}
          instead.
        </p>
      ) : null}

      <div>
        <button
          type="submit"
          disabled={pending}
          className={buttonClass("primary", "disabled:opacity-60")}
        >
          {pending ? "Sending..." : "Send message"}
        </button>
      </div>
    </form>
  );
}

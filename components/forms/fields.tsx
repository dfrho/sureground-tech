/**
 * Labelled form fields with inline errors (WCAG 2.2 AA). Each error is tied
 * to its input with aria-describedby, and aria-invalid is set when present.
 */

const inputClass =
  "w-full rounded-button border border-border bg-surface px-3 py-2.5 text-body text-text placeholder:text-muted focus-visible:border-accent-text aria-invalid:border-2 aria-invalid:border-text";

interface BaseProps {
  name: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  defaultValue?: string;
}

function Label({ id, label, optional }: { id: string; label: string; optional?: boolean }) {
  return (
    <label htmlFor={id} className="text-small font-semibold">
      {label}
      {optional ? <span className="font-normal text-muted"> (optional)</span> : null}
    </label>
  );
}

function Help({ id, hint, error }: { id: string; hint?: string; error?: string }) {
  return (
    <>
      {hint ? (
        <p id={`${id}-hint`} className="text-small text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-small font-semibold">
          <span className="font-mono text-label uppercase">Error: </span>
          {error}
        </p>
      ) : null}
    </>
  );
}

function describedBy(id: string, hint?: string, error?: string) {
  return (
    [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") ||
    undefined
  );
}

export function TextField({
  name,
  label,
  error,
  hint,
  optional,
  defaultValue,
  type = "text",
  maxLength,
  autoComplete,
}: BaseProps & { type?: "text" | "email"; maxLength: number; autoComplete?: string }) {
  const id = `field-${name}`;
  return (
    <div className="flex flex-col gap-1.5">
      <Label id={id} label={label} optional={optional} />
      <input
        id={id}
        name={name}
        type={type}
        required={!optional}
        maxLength={maxLength}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={`${inputClass} min-h-11`}
      />
      <Help id={id} hint={hint} error={error} />
    </div>
  );
}

export function TextArea({
  name,
  label,
  error,
  hint,
  defaultValue,
  maxLength,
  rows = 6,
}: BaseProps & { maxLength: number; rows?: number }) {
  const id = `field-${name}`;
  return (
    <div className="flex flex-col gap-1.5">
      <Label id={id} label={label} />
      <textarea
        id={id}
        name={name}
        required
        rows={rows}
        maxLength={maxLength}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={inputClass}
      />
      <Help id={id} hint={hint} error={error} />
    </div>
  );
}

export function SelectField({
  name,
  label,
  error,
  defaultValue,
  options,
}: BaseProps & { options: readonly string[] }) {
  const id = `field-${name}`;
  return (
    <div className="flex flex-col gap-1.5">
      <Label id={id} label={label} />
      {/* Keyed by its default so a returned value remounts it: React does not
          update a select's default after mount, and the form reset that
          follows an action would otherwise put it back to "Choose one". */}
      <select
        key={defaultValue ?? ""}
        id={id}
        name={name}
        required
        defaultValue={defaultValue ?? ""}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, undefined, error)}
        className={`${inputClass} min-h-11`}
      >
        <option value="" disabled>
          Choose one
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <Help id={id} error={error} />
    </div>
  );
}

/**
 * Honeypot. Hidden from people and assistive tech; bots that fill every
 * field fill this one too.
 */
export function Honeypot({ name }: { name: string }) {
  return (
    <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
      <label htmlFor={`hp-${name}`}>Leave this empty</label>
      <input
        id={`hp-${name}`}
        name={name}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        defaultValue=""
      />
    </div>
  );
}

/** A required checkbox with its label beside it and an inline error. */
export function CheckboxField({
  name,
  label,
  value = "yes",
  error,
  defaultChecked,
}: {
  name: string;
  label: string;
  value?: string;
  error?: string;
  defaultChecked?: boolean;
}) {
  const id = `field-${name}`;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex min-h-11 items-start gap-3">
        <input
          id={id}
          name={name}
          type="checkbox"
          value={value}
          required
          defaultChecked={defaultChecked}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, undefined, error)}
          className="mt-0.5 size-6 shrink-0 accent-accent-fill"
        />
        <label htmlFor={id} className="text-body">
          {label}
        </label>
      </div>
      <Help id={id} error={error} />
    </div>
  );
}

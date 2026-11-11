/**
 * A page section with the mono section number ("01 / Services") above its
 * heading. The heading id labels the section for screen readers.
 */
export function Section({
  id,
  number,
  label,
  title,
  intro,
  children,
  className = "",
}: {
  id: string;
  number?: string;
  label?: string;
  title: string;
  intro?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  const headingId = `${id}-title`;
  return (
    <section id={id} aria-labelledby={headingId} className={`py-14 sm:py-18 ${className}`.trim()}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {number || label ? (
          <p className="font-mono text-label text-muted uppercase">
            {[number, label].filter(Boolean).join(" / ")}
          </p>
        ) : null}
        <h2 id={headingId} className="mt-2 max-w-3xl font-display text-h2">
          {title}
        </h2>
        {intro ? <div className="mt-3 max-w-2xl text-muted">{intro}</div> : null}
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  );
}

/** The card surface used across the site: surface fill, 1px border, no shadow. */
export const cardClass = "rounded-card border border-border bg-surface p-6";

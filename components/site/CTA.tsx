import { ButtonLink } from "@/components/site/Button";

/**
 * The two calls to action used across the site. A visitor who has just
 * finished the scorecard gets the Fit Call alone, as the primary button.
 */
export function CtaButtons({
  className = "",
  scorecardDone = false,
}: {
  className?: string;
  scorecardDone?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:flex-wrap ${className}`.trim()}>
      {scorecardDone ? null : (
        <ButtonLink href="/scorecard">
          Check your AI readiness
          <span className="font-mono text-label font-normal">5 min</span>
        </ButtonLink>
      )}
      <ButtonLink href="/contact#book" variant={scorecardDone ? "primary" : "secondary"}>
        Book a free AI Fit Call
      </ButtonLink>
    </div>
  );
}

export interface CtaLink {
  label: string;
  href: string;
}

/** Closing call to action at the end of a page. */
export function CTA({
  title = "Start with one small, safe step.",
  body = "Find out how solid your ground is in five minutes, or talk it through on a free call.",
  scorecardDone = false,
  links,
}: {
  title?: string;
  body?: string;
  /** The visitor arrived from their scorecard results. */
  scorecardDone?: boolean;
  /** Replaces the standard buttons; the first is the primary button. */
  links?: readonly CtaLink[];
}) {
  return (
    <section aria-labelledby="cta-title" className="py-14 sm:py-18">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-card border border-border bg-surface px-6 py-10 sm:px-10">
          <h2 id="cta-title" className="max-w-2xl font-display text-h2">
            {title}
          </h2>
          <p className="mt-3 max-w-2xl text-muted">{body}</p>
          {links ? (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {links.map((link, i) => (
                <ButtonLink
                  key={link.href + link.label}
                  href={link.href}
                  variant={i === 0 ? "primary" : "secondary"}
                >
                  {link.label}
                </ButtonLink>
              ))}
            </div>
          ) : (
            <CtaButtons className="mt-6" scorecardDone={scorecardDone} />
          )}
        </div>
      </div>
    </section>
  );
}

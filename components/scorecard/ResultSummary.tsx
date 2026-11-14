import { buttonClass, ButtonLink } from "@/components/site/Button";
import type { ScorecardOutcome } from "@/lib/forms/scorecard-schema";

/**
 * The results screen. Everything shown comes from the server's own score.
 * Nothing is stored: refreshing the page clears it.
 *
 * COPY: draft
 */
export function ResultSummary({
  outcome,
  headingRef,
  onRestart,
}: {
  outcome: ScorecardOutcome;
  headingRef: React.Ref<HTMLHeadingElement>;
  onRestart: () => void;
}) {
  const { recommendation } = outcome;
  return (
    <div className="flex flex-col gap-10" data-testid="scorecard-result">
      <div className="flex flex-col gap-3">
        <p className="font-mono text-label text-muted uppercase">Your result</p>
        <h2 ref={headingRef} tabIndex={-1} className="font-display text-h1 outline-none">
          {outcome.band.name}
        </h2>
        <p className="font-mono text-body">
          {outcome.total} <span className="text-muted">of {outcome.max}</span>
        </p>
        <p className="max-w-2xl text-muted">{outcome.band.summary}</p>
        <p className="text-small text-muted">
          We also emailed these results to you. This page keeps no copy, so refreshing it clears
          them.
        </p>
      </div>

      <section aria-labelledby="areas-title" className="flex flex-col gap-4">
        <h3 id="areas-title" className="font-display text-h3">
          Your six areas
        </h3>
        <ul className="flex flex-col gap-3">
          {outcome.dimensions.map((d) => (
            <li
              key={d.label}
              className="grid grid-cols-[6.5rem_minmax(0,1fr)_auto] items-center gap-3"
            >
              <span className="font-semibold">{d.label}</span>
              <span aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-border">
                <span
                  className="block h-full rounded-full bg-accent-fill"
                  style={{ width: `${Math.round((d.score / d.max) * 100)}%` }}
                />
              </span>
              <span className="font-mono text-small text-muted">
                {d.score} of {d.max}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="observations-title" className="flex flex-col gap-4">
        <h3 id="observations-title" className="font-display text-h3">
          What stands out
        </h3>
        <ul className="flex max-w-2xl list-disc flex-col gap-2 pl-5">
          {outcome.observations.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="next-title"
        className="flex flex-col gap-4 rounded-card border border-border bg-surface p-6"
      >
        <p className="font-mono text-label text-muted uppercase">Your first step</p>
        <h3 id="next-title" className="font-display text-h2">
          {recommendation.name}
        </h3>
        <p className="font-mono text-small">{recommendation.price}</p>
        <p className="max-w-2xl">{recommendation.reason}</p>
        <p className="max-w-2xl text-muted">{recommendation.summary}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ButtonLink href="/contact#book">Book a free AI Fit Call</ButtonLink>
          <ButtonLink
            href={`${recommendation.href}?from=scorecard`}
            variant="secondary"
            className="py-2 text-center whitespace-normal!"
            // A new tab keeps these results: they live only in this page.
            newTab
          >
            Read about {recommendation.name}
          </ButtonLink>
        </div>
      </section>

      <div className="flex flex-col gap-4">
        <p className="max-w-2xl text-small text-muted">{outcome.disclaimer}</p>
        <div>
          <button type="button" onClick={onRestart} className={buttonClass("secondary")}>
            Start over
          </button>
        </div>
      </div>
    </div>
  );
}

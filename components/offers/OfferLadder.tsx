import Link from "next/link";

import { PriceTag } from "@/components/offers/PriceTag";
import { getOffer, type OfferSlug } from "@/lib/config/offers";
import { serviceHref } from "@/lib/offers/format";

type Rung = {
  step: string;
  title: string;
  body: string;
  offers: { slug: OfferSlug; href?: string }[];
};

/** The four steps of the path, each naming its offers and starting prices. */
const rungs: Rung[] = [
  {
    step: "01",
    title: "Find your footing",
    body: "Take the scorecard or book a call. Either way, you leave with a clear first step.",
    offers: [{ slug: "fit-call" }],
  },
  {
    step: "02",
    title: "Assess",
    body: "Find the AI already in use and set the rules, or map your workflows and rank the opportunities.",
    offers: [{ slug: "safe-start" }, { slug: "opportunity-assessment" }],
  },
  {
    step: "03",
    title: "Pilot",
    body: "Put one workflow live on proven tools, with approval points and a launch date.",
    offers: [{ slug: "pilot-sprint" }],
  },
  {
    step: "04",
    title: "Operate",
    body: "Keep it working and improving, month to month, including A/B testing.",
    offers: [{ slug: "managed-ops" }],
  },
];

/** Each rung sits higher than the last from the lg breakpoint up. */
const rise = ["lg:mb-0", "lg:mb-6", "lg:mb-12", "lg:mb-18"];

/**
 * The signature visual: a stepped, numbered ladder. Each rung sits a little
 * higher than the last on wide screens; on mobile it is a numbered list.
 */
export function OfferLadder() {
  return (
    <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 lg:items-end">
      {rungs.map((rung, i) => (
        <li
          key={rung.step}
          className={`flex flex-col gap-3 rounded-card border border-border bg-surface p-6 ${rise[i]}`}
        >
          <p className="font-mono text-label text-muted">
            Step{" "}
            <span className={i === rungs.length - 1 ? "text-text" : undefined}>{rung.step}</span>
          </p>
          <h3 className="font-display text-h3">{rung.title}</h3>
          <p className="text-muted">{rung.body}</p>
          <ul className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
            {rung.offers.map(({ slug }) => {
              const offer = getOffer(slug);
              return (
                <li key={slug}>
                  <Link
                    href={serviceHref(slug)}
                    className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4 hover:decoration-2"
                  >
                    {offer.name}
                  </Link>
                  <PriceTag offer={offer} />
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ol>
  );
}

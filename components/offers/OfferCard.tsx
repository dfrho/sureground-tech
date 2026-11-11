import Link from "next/link";

import { PriceTag } from "@/components/offers/PriceTag";
import { ArrowRight } from "@/components/site/icons";
import type { Offer } from "@/lib/config/offers";
import { serviceHref } from "@/lib/offers/format";

/** A card for one offer: name, summary, duration and starting price. */
export function OfferCard({
  offer,
  headingLevel = 3,
  showDuration = true,
}: {
  offer: Offer;
  headingLevel?: 2 | 3;
  showDuration?: boolean;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className="relative flex h-full flex-col gap-4 rounded-card border border-border bg-surface p-6 focus-within:border-accent-text hover:border-accent-text">
      <Heading className="font-display text-h3">
        <Link
          href={serviceHref(offer.slug)}
          className="after:absolute after:inset-0 after:rounded-card"
        >
          {offer.name}
        </Link>
      </Heading>
      <p className="text-muted">{offer.summary}</p>
      <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-2">
        <div>
          <PriceTag offer={offer} />
          {showDuration ? (
            <p className="font-mono text-label text-muted">{offer.duration}</p>
          ) : null}
        </div>
        <ArrowRight className="size-5 text-accent-text" />
      </div>
    </article>
  );
}

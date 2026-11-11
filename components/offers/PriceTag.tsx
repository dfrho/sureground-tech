import type { Offer } from "@/lib/config/offers";
import { priceLabel } from "@/lib/offers/format";

/** "Starting at" plus the price from offers.ts, in mono. */
export function PriceTag({
  offer,
  className = "",
}: {
  offer: Pick<Offer, "startingAt" | "cadence">;
  className?: string;
}) {
  const free = offer.startingAt === 0;
  return (
    <p className={`font-mono text-small ${className}`.trim()}>
      {free ? null : <span className="text-muted">Starting at </span>}
      <span className="font-medium text-text">{priceLabel(offer)}</span>
    </p>
  );
}

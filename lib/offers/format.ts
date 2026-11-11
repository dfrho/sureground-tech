import { getOffer, offers, type Offer, type OfferGroup, type OfferSlug } from "@/lib/config/offers";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** Whole US dollars, formatted with a dollar sign and thousands separators. */
export function formatUsd(amount: number): string {
  return usd.format(amount);
}

/** "Free", the amount, or the amount followed by "per month". */
export function priceLabel(offer: Pick<Offer, "startingAt" | "cadence">): string {
  if (offer.startingAt === 0) return "Free";
  const amount = formatUsd(offer.startingAt);
  return offer.cadence === "monthly" ? `${amount} per month` : amount;
}

/** "Free", or "Starting at" followed by priceLabel(). */
export function startingAtLabel(offer: Pick<Offer, "startingAt" | "cadence">): string {
  return offer.startingAt === 0 ? "Free" : `Starting at ${priceLabel(offer)}`;
}

export const groupLabels: Record<OfferGroup, string> = {
  core: "Core services",
  start: "Start",
  build: "Build",
  specialty: "Specialty",
  operate: "Operate",
};

export function offersInGroup(group: OfferGroup): Offer[] {
  return offers.filter((o) => o.group === group);
}

export function serviceHref(slug: OfferSlug | string): string {
  return `/services/${slug}`;
}

export { getOffer };

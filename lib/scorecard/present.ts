import { dimensionInfo, disclaimer } from "@/content/scorecard";
import type { OfferSlug } from "@/lib/config/offers";
import type { ScorecardOutcome } from "@/lib/forms/scorecard-schema";
import { getOffer, serviceHref, startingAtLabel } from "@/lib/offers/format";

import type { ScoreResult } from "./score";

/**
 * Turns a score into the plain data the results screen and both emails show.
 * Prices come from offers.ts through startingAtLabel.
 */
export function present(result: ScoreResult): ScorecardOutcome {
  const offer = getOffer(result.recommendation.offer as OfferSlug);
  return {
    total: result.total,
    max: result.max,
    band: { name: result.band.name, summary: result.band.summary },
    dimensions: result.dimensions.map((d) => ({
      label: dimensionInfo[d.dimension].label,
      score: d.score,
      max: d.max,
    })),
    observations: result.observations,
    recommendation: {
      name: offer.name,
      summary: offer.summary,
      price: startingAtLabel(offer),
      href: serviceHref(offer.slug),
      reason: result.recommendation.reason,
    },
    disclaimer,
  };
}

import { describe, expect, it } from "vitest";

import { getOffer, offerSchema, offers, unconfirmedOffers, type Offer } from "@/lib/config/offers";

describe("offers config", () => {
  it("has unique slugs", () => {
    const slugs = offers.map((o) => o.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("includes the three core services and the full ladder", () => {
    for (const slug of [
      "ai-engineering",
      "agent-development",
      "ai-enablement",
      "fit-call",
      "safe-start",
      "opportunity-assessment",
      "pilot-sprint",
      "pilot-triage",
      "answer-engine",
      "managed-ops",
      "fractional-se",
    ] as const) {
      expect(getOffer(slug).slug).toBe(slug);
    }
  });

  it("keeps the Fit Call free and monthly offers monthly", () => {
    expect(getOffer("fit-call").startingAt).toBe(0);
    expect(getOffer("managed-ops").cadence).toBe("monthly");
    expect(getOffer("fractional-se").cadence).toBe("monthly");
  });

  it("prices AI Enablement as a half-day workshop and a 4-week team program", () => {
    const offer = getOffer("ai-enablement");
    expect(offer.tiers).toEqual([
      { name: "Half-day workshop", duration: "Half day", startingAt: 1500 },
      { name: "Team program", duration: "4 weeks", startingAt: 4500 },
    ]);
    expect(offer.startingAt).toBe(1500);
  });

  it("rejects a tiered offer whose startingAt is not the lowest tier", () => {
    const bad = { ...getOffer("ai-enablement"), startingAt: 4500 };
    expect(offerSchema.safeParse(bad).success).toBe(false);
  });

  it("reports unconfirmed offers", () => {
    const sample = [
      { ...offers[0], confirmed: true },
      { ...offers[1], confirmed: false },
    ] satisfies Offer[];
    expect(unconfirmedOffers(sample).map((o) => o.slug)).toEqual([offers[1].slug]);
  });
});

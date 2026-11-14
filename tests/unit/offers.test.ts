import { describe, expect, it } from "vitest";

import { getOffer, offerSchema, offers, unconfirmedOffers, type Offer } from "@/lib/config/offers";
import { addOnLabel } from "@/lib/offers/format";

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
      "demo-site-build",
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

  it("prices the Guided Demo Site Build as approved on 2026-11-14", () => {
    const offer = getOffer("demo-site-build");
    expect(offer.group).toBe("specialty");
    expect(offer.startingAt).toBe(7500);
    expect(offer.duration).toBe("2 to 6 weeks");
    expect(offer.tiers).toEqual([
      { name: "Demo Pilot", duration: "2 to 3 weeks", startingAt: 7500 },
      { name: "Demo Site Build", duration: "4 to 6 weeks", startingAt: 15000 },
    ]);
    expect(offer.addOns).toEqual([
      { name: "Industry or segment version", startingAt: 3500, cadence: "one-time" },
      { name: "Named-customer version", startingAt: 1500, cadence: "one-time" },
      { name: "Demo Upkeep", startingAt: 2000, cadence: "monthly" },
    ]);
    expect(offer.terms).toEqual([
      "Full pilot fee comes off a full build started within 60 days",
      "Paid in milestones",
      "Live in 4 weeks or we keep working at no charge (conditioned on client access within 5 business days and reviews within 3)",
    ]);
    expect(offer.confirmed).toBe(true);
  });

  it("validates add-ons", () => {
    const base = getOffer("answer-engine");
    const ok = { ...base, addOns: [{ name: "Upkeep", startingAt: 750, cadence: "monthly" }] };
    expect(offerSchema.safeParse(ok).success).toBe(true);
    for (const addOns of [
      [],
      [{ name: "", startingAt: 750, cadence: "monthly" }],
      [{ name: "Upkeep", startingAt: 0, cadence: "monthly" }],
      [{ name: "Upkeep", startingAt: 750, cadence: "weekly" }],
      [{ name: "Upkeep", startingAt: 750, cadence: "monthly", extra: true }],
    ]) {
      expect(offerSchema.safeParse({ ...base, addOns }).success).toBe(false);
    }
  });

  it("formats add-on prices", () => {
    expect(
      addOnLabel({ name: "Named-customer version", startingAt: 1500, cadence: "one-time" }),
    ).toBe("Named-customer version: $1,500");
    expect(addOnLabel({ name: "Demo Upkeep", startingAt: 2000, cadence: "monthly" })).toBe(
      "Demo Upkeep: $2,000 per month",
    );
  });

  it("reports unconfirmed offers", () => {
    const sample = [
      { ...offers[0], confirmed: true },
      { ...offers[1], confirmed: false },
    ] satisfies Offer[];
    expect(unconfirmedOffers(sample).map((o) => o.slug)).toEqual([offers[1].slug]);
  });
});

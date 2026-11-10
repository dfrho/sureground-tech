import { describe, expect, it } from "vitest";

import { facts, yearsOfExperience } from "@/content/facts";
import { services } from "@/content/services";
import { sources } from "@/content/sources";
import { offers } from "@/lib/config/offers";
import { formatUsd, priceLabel, startingAtLabel } from "@/lib/offers/format";
import { breadcrumbLd, serializeJsonLd, serviceLd } from "@/lib/seo/jsonld";

const allText = (value: unknown) => JSON.stringify(value);

describe("facts", () => {
  it("names only the allowed former employers", () => {
    expect([...facts.formerEmployers].sort()).toEqual([
      "AutoZone",
      "Feedonomics",
      "FullStory",
      "Shogun",
    ]);
    for (const role of facts.career) {
      if (role.named) expect(facts.formerEmployers).toContain(role.employer);
    }
  });

  it("holds no personal contact details", () => {
    const text = allText(facts);
    expect(text).not.toMatch(/\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/); // phone numbers
    expect(text).not.toMatch(/@/); // email addresses
    expect(text).not.toMatch(/linkedin\.com\/in\//i);
    expect(text).not.toMatch(/present|current/i);
  });

  it("rounds years of experience down to a multiple of five", () => {
    expect(yearsOfExperience(new Date("2026-11-10"))).toBe(20);
    expect(yearsOfExperience(new Date("2029-06-01"))).toBe(25);
  });
});

describe("sources", () => {
  it("cites every statistic with an https URL and dates", () => {
    expect(sources.length).toBeGreaterThan(0);
    for (const s of sources) {
      expect(s.url.startsWith("https://")).toBe(true);
      expect(s.published <= s.checked).toBe(true);
    }
  });

  it("has unique ids", () => {
    const ids = sources.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("service content", () => {
  it("has one page of content for every offer", () => {
    expect(services.map((s) => s.slug).sort()).toEqual(offers.map((o) => o.slug).sort());
  });

  it("never states a price or a duration (those live in offers.ts)", () => {
    for (const s of services) {
      const text = allText(s);
      expect(text, s.slug).not.toMatch(/\$\s?\d/);
      expect(text, s.slug).not.toMatch(
        /\b\d+\s*(?:-\s*)?(?:minutes?|hours?|days?|weeks?|months?)\b/i,
      );
    }
  });
});

describe("price formatting", () => {
  it("formats whole dollars", () => {
    expect(formatUsd(10000)).toBe("$10,000");
  });

  it("labels free, one-time and monthly offers", () => {
    expect(priceLabel({ startingAt: 0, cadence: "one-time" })).toBe("Free");
    expect(priceLabel({ startingAt: 2500, cadence: "one-time" })).toBe("$2,500");
    expect(priceLabel({ startingAt: 1000, cadence: "monthly" })).toBe("$1,000 per month");
    expect(startingAtLabel({ startingAt: 3500, cadence: "one-time" })).toBe("Starting at $3,500");
    expect(startingAtLabel({ startingAt: 0, cadence: "one-time" })).toBe("Free");
  });
});

describe("JSON-LD", () => {
  it("escapes characters that could close the script element", () => {
    const out = serializeJsonLd({ name: "</script><script>alert(1)</script>", sep: "a b" });
    expect(out).not.toContain("<");
    expect(out).not.toContain(" ");
    expect(JSON.parse(out)).toEqual({ name: "</script><script>alert(1)</script>", sep: "a b" });
  });

  it("builds a Service with the price from offers.ts", () => {
    const offer = offers.find((o) => o.slug === "managed-ops")!;
    const ld = serviceLd(offer, "/services/managed-ops");
    expect(ld.offers.price).toBe(offer.startingAt);
    expect(ld.url).toBe("https://sureground.tech/services/managed-ops");
  });

  it("numbers breadcrumb items from 1", () => {
    const ld = breadcrumbLd([
      { name: "Home", path: "/" },
      { name: "Services", path: "/services" },
    ]);
    expect(ld.itemListElement.map((i) => i.position)).toEqual([1, 2]);
  });
});

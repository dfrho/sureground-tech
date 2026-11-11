import { facts } from "@/content/facts";
import type { Offer } from "@/lib/config/offers";
import { site } from "@/lib/config/site";

/**
 * JSON-LD builders and the one serializer allowed to feed
 * dangerouslySetInnerHTML (CLAUDE.md A05). Every input is a repo constant.
 */

/** JSON for a script element: "<" is escaped so no value can close the tag. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

const orgId = `${site.url}/#organization`;
const personId = `${site.url}/about#david-rhodes`;

export function absoluteUrl(path: string): string {
  return new URL(path, site.url).toString();
}

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": orgId,
    name: site.name,
    slogan: site.tagline,
    description: site.boilerplate,
    url: site.url,
    email: site.contactEmail,
    logo: absoluteUrl("/icon.svg"),
    address: {
      "@type": "PostalAddress",
      addressLocality: "Nashville",
      addressRegion: "TN",
      addressCountry: "US",
    },
    areaServed: { "@type": "Country", name: "United States" },
    founder: { "@id": personId },
    sameAs: site.social.linkedin ? [site.social.linkedin] : [],
  };
}

export function personLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": personId,
    name: facts.name,
    jobTitle: facts.role,
    worksFor: { "@id": orgId },
    image: absoluteUrl("/images/david-rhodes.jpg"),
    url: absoluteUrl("/about"),
    alumniOf: { "@type": "CollegeOrUniversity", name: facts.education.school },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Nashville",
      addressRegion: "TN",
      addressCountry: "US",
    },
  };
}

export function serviceLd(offer: Offer, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: offer.name,
    description: offer.summary,
    url: absoluteUrl(path),
    provider: { "@id": orgId },
    areaServed: { "@type": "Country", name: "United States" },
    offers: {
      "@type": "Offer",
      price: offer.startingAt,
      priceCurrency: "USD",
      ...(offer.cadence === "monthly"
        ? {
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: offer.startingAt,
              priceCurrency: "USD",
              unitText: "MONTH",
            },
          }
        : {}),
    },
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

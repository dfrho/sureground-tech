import type { Metadata } from "next";
import Link from "next/link";

import { PriceDetails } from "@/components/offers/PriceDetails";
import { PriceTag } from "@/components/offers/PriceTag";
import { JsonLd } from "@/components/seo/JsonLd";
import { CTA } from "@/components/site/CTA";
import { offerGroups, type Offer } from "@/lib/config/offers";
import { groupLabels, offersInGroup, serviceHref } from "@/lib/offers/format";
import { breadcrumbLd } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Starting prices, durations and terms for every SureGround offer, from the free AI Fit Call to monthly support.",
  alternates: { canonical: "/pricing" },
};

const linkClass = "font-semibold text-accent-text underline-offset-4 hover:underline";

function Terms({ offer }: { offer: Offer }) {
  if (offer.terms.length === 0) return <span className="text-muted">None</span>;
  return (
    <ul className="flex flex-col gap-1">
      {offer.terms.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}

export default function PricingPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Pricing", path: "/pricing" },
        ])}
      />
      {/* COPY: draft */}
      <section aria-labelledby="pricing-title" className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-14 sm:px-6 sm:py-18">
          <p className="font-mono text-label text-muted uppercase">Pricing</p>
          <h1 id="pricing-title" className="max-w-3xl font-display text-h1">
            Fixed fees, published up front.
          </h1>
          <p className="max-w-2xl text-muted">
            Every packaged offer has a fixed fee, agreed in writing before work starts. The prices
            below are starting points, and your written scope sets the final fee.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {/* Desktop: one table, grouped by step on the path. */}
        <table className="hidden w-full border-collapse text-left lg:table">
          <caption className="sr-only">
            Every SureGround offer with its duration, starting price and terms
          </caption>
          <thead>
            <tr className="border-b border-border font-mono text-label text-muted uppercase">
              <th scope="col" className="py-3 pr-6 font-normal">
                Offer
              </th>
              <th scope="col" className="py-3 pr-6 font-normal">
                Duration
              </th>
              <th scope="col" className="py-3 pr-6 font-normal">
                Price
              </th>
              <th scope="col" className="py-3 font-normal">
                Terms
              </th>
            </tr>
          </thead>
          {offerGroups.map((group) => (
            <tbody key={group}>
              <tr>
                <th scope="colgroup" colSpan={4} className="pt-8 pb-2 font-display text-h3">
                  {groupLabels[group]}
                </th>
              </tr>
              {offersInGroup(group).map((offer) => (
                <tr key={offer.slug} className="border-t border-border align-top">
                  <th scope="row" className="py-4 pr-6 font-normal">
                    <Link href={serviceHref(offer.slug)} className={linkClass}>
                      {offer.name}
                    </Link>
                    <p className="mt-1 max-w-sm text-small text-muted">{offer.summary}</p>
                  </th>
                  <td className="py-4 pr-6">{offer.duration}</td>
                  <td className="py-4 pr-6">
                    <PriceTag offer={offer} />
                    <PriceDetails offer={offer} />
                  </td>
                  <td className="py-4">
                    <Terms offer={offer} />
                  </td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>

        {/* Mobile and tablet: stacked cards. */}
        <div className="flex flex-col gap-10 lg:hidden">
          {offerGroups.map((group) => (
            <section key={group} aria-labelledby={`pricing-${group}`}>
              <h2 id={`pricing-${group}`} className="font-display text-h3">
                {groupLabels[group]}
              </h2>
              <ul className="mt-4 grid gap-4 md:grid-cols-2">
                {offersInGroup(group).map((offer) => (
                  <li
                    key={offer.slug}
                    className="flex flex-col gap-3 rounded-card border border-border bg-surface p-6"
                  >
                    <h3 className="font-display text-h3">
                      <Link href={serviceHref(offer.slug)} className="underline underline-offset-4">
                        {offer.name}
                      </Link>
                    </h3>
                    <p className="text-small text-muted">{offer.summary}</p>
                    <dl className="flex flex-col gap-3 border-t border-border pt-3">
                      <div>
                        <dt className="font-mono text-label text-muted uppercase">Price</dt>
                        <dd>
                          <PriceTag offer={offer} />
                          <PriceDetails offer={offer} />
                        </dd>
                      </div>
                      <div>
                        <dt className="font-mono text-label text-muted uppercase">Duration</dt>
                        <dd>{offer.duration}</dd>
                      </div>
                      {offer.terms.length > 0 ? (
                        <div>
                          <dt className="font-mono text-label text-muted uppercase">Terms</dt>
                          <dd>
                            <Terms offer={offer} />
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>

      <CTA
        title="Not sure which step fits?"
        body="Take the five-minute scorecard, or book a free call and we'll tell you."
      />
    </>
  );
}

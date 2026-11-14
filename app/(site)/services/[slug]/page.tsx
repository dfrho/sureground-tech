import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { OfferCard } from "@/components/offers/OfferCard";
import { PriceTag } from "@/components/offers/PriceTag";
import { JsonLd } from "@/components/seo/JsonLd";
import { CTA } from "@/components/site/CTA";
import { CheckIcon } from "@/components/site/icons";
import { cardClass } from "@/components/site/Section";
import { facts } from "@/content/facts";
import { getService, services } from "@/content/services";
import { offers, type Offer, type OfferSlug } from "@/lib/config/offers";
import { formatUsd, groupLabels, serviceHref } from "@/lib/offers/format";
import { breadcrumbLd, serviceLd } from "@/lib/seo/jsonld";

// Only the offers in offers.ts have pages; any other slug is a 404 (A01).
export const dynamicParams = false;

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

function load(
  slug: string,
): { offer: Offer; content: NonNullable<ReturnType<typeof getService>> } | null {
  const offer = offers.find((o) => o.slug === slug);
  const content = offer ? getService(offer.slug as OfferSlug) : undefined;
  return offer && content ? { offer, content } : null;
}

export async function generateMetadata({
  params,
}: PageProps<"/services/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const found = load(slug);
  if (!found) return {};
  return {
    title: found.offer.name,
    description: found.offer.summary,
    alternates: { canonical: serviceHref(slug) },
  };
}

export default async function ServicePage({ params, searchParams }: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  // Set by the scorecard results link. Only this exact value counts.
  const scorecardDone = (await searchParams).from === "scorecard";
  const found = load(slug);
  if (!found) notFound();
  const { offer, content } = found;
  const path = serviceHref(offer.slug);
  const proof = content.proof.map((id) => facts.proofPoints.find((p) => p.id === id)!);
  const related = content.related.map((s) => offers.find((o) => o.slug === s)!);

  return (
    <>
      <JsonLd data={serviceLd(offer, path)} />
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
          { name: offer.name, path },
        ])}
      />
      {/* COPY: draft */}

      <section aria-labelledby="service-title" className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-4">
            <nav aria-label="Breadcrumb">
              <ol className="flex flex-wrap gap-2 font-mono text-label text-muted uppercase">
                <li>
                  <Link
                    href="/services"
                    className="underline-offset-4 hover:text-text hover:underline"
                  >
                    Services
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li>{groupLabels[offer.group]}</li>
              </ol>
            </nav>
            <p className="font-display text-h3 text-accent-text">{offer.name}</p>
            <h1 id="service-title" className="font-display text-h1">
              {content.headline}
            </h1>
            <p className="max-w-2xl text-h3 font-normal text-muted">{content.intro}</p>
          </div>

          <aside aria-label="At a glance" className={`${cardClass} flex flex-col gap-4 self-start`}>
            <dl className="flex flex-col gap-4">
              <div>
                <dt className="font-mono text-label text-muted uppercase">Price</dt>
                <dd>
                  <PriceTag offer={offer} className="text-body" />
                </dd>
                {offer.tiers ? (
                  <dd>
                    <ul className="mt-2 flex flex-col gap-1 text-small text-muted">
                      {offer.tiers.map((t) => (
                        <li key={t.name}>
                          {t.name} ({t.duration}): {formatUsd(t.startingAt)}
                        </li>
                      ))}
                    </ul>
                  </dd>
                ) : null}
              </div>
              <div>
                <dt className="font-mono text-label text-muted uppercase">Duration</dt>
                <dd>{offer.duration}</dd>
              </div>
              {offer.terms.length > 0 ? (
                <div>
                  <dt className="font-mono text-label text-muted uppercase">Terms</dt>
                  {offer.terms.map((term) => (
                    <dd key={term} className="mt-1 flex gap-2">
                      <CheckIcon className="mt-1 size-5 shrink-0 text-accent-text" />
                      <span>{term}</span>
                    </dd>
                  ))}
                </div>
              ) : null}
            </dl>
          </aside>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2">
        <section aria-labelledby="who-title">
          <h2 id="who-title" className="font-display text-h2">
            Who it&apos;s for
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {content.whoFor.map((item) => (
              <li key={item} className="flex gap-2">
                <CheckIcon className="mt-1 size-5 shrink-0 text-accent-text" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="problem-title">
          <h2 id="problem-title" className="font-display text-h2">
            The problem
          </h2>
          <p className="mt-4 text-muted">{content.problem}</p>
        </section>

        <section aria-labelledby="get-title">
          <h2 id="get-title" className="font-display text-h2">
            What you get
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {offer.deliverables.map((item) => (
              <li key={item} className="flex gap-2">
                <CheckIcon className="mt-1 size-5 shrink-0 text-accent-text" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="how-title">
          <h2 id="how-title" className="font-display text-h2">
            How it works
          </h2>
          <ol className="mt-4 flex flex-col gap-4">
            {content.steps.map((step, i) => (
              <li key={step.title} className="flex gap-4">
                <span className="font-mono text-label text-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="why-title" className="lg:col-span-2">
          <h2 id="why-title" className="font-display text-h2">
            Why SureGround
          </h2>
          <ul className="mt-4 grid gap-4 md:grid-cols-3">
            {proof.map((p) => (
              <li key={p.id} className={cardClass}>
                {p.text}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="faq-title" className="lg:col-span-2">
          <h2 id="faq-title" className="font-display text-h2">
            Questions
          </h2>
          <dl className="mt-4 grid gap-6 md:grid-cols-2">
            {content.faq.map((item) => (
              <div key={item.q}>
                <dt className="font-semibold">{item.q}</dt>
                <dd className="mt-1 text-muted">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      {related.length > 0 ? (
        <section aria-labelledby="related-title" className="border-t border-border">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h2 id="related-title" className="font-display text-h2">
              Related offers
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {related.map((o) => (
                <OfferCard key={o.slug} offer={o} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {scorecardDone ? (
        <CTA
          title="Talk through your results."
          body="You have your scorecard results. On a free AI Fit Call we go over them and whether this is the right first step."
          scorecardDone
        />
      ) : (
        <CTA />
      )}
    </>
  );
}

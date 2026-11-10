import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { StepMotif } from "@/components/brand/StepMotif";
import { StatCard } from "@/components/content/StatCard";
import { OfferCard } from "@/components/offers/OfferCard";
import { OfferLadder } from "@/components/offers/OfferLadder";
import { JsonLd } from "@/components/seo/JsonLd";
import { CTA, CtaButtons } from "@/components/site/CTA";
import { CheckIcon } from "@/components/site/icons";
import { Section } from "@/components/site/Section";
import { facts, yearsOfExperience } from "@/content/facts";
import { getOffer, type OfferSlug } from "@/lib/config/offers";
import { offersInGroup, serviceHref } from "@/lib/offers/format";
import { organizationLd } from "@/lib/seo/jsonld";

/** "a, b and c" */
function listJoin(items: readonly string[]): string {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

const subhead =
  "We've walked this path. SureGround builds AI into your business on proven ground, then trains your team to run it.";

export const metadata: Metadata = {
  title: { absolute: "SureGround | AI on sure ground" },
  description: subhead,
  alternates: { canonical: "/" },
};

/** Offers whose approved terms appear under "Risk off your plate". */
const riskOffers: OfferSlug[] = [
  "safe-start",
  "opportunity-assessment",
  "pilot-sprint",
  "managed-ops",
];
const specialty: OfferSlug[] = ["pilot-triage", "answer-engine", "catalog-readiness"];

export default function Home() {
  const years = yearsOfExperience();

  return (
    <>
      <JsonLd data={organizationLd()} />
      {/* COPY: draft */}

      {/* 1. Hero */}
      <section aria-labelledby="hero-title" className="border-b border-border">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[3fr_2fr]">
          <div className="flex flex-col gap-5">
            <p className="flex items-center gap-2 font-mono text-label text-muted">
              <span aria-hidden="true" className="size-2 rounded-full bg-highlight" />
              &gt; grounded_ai + enablement
            </p>
            <h1 id="hero-title" className="font-display text-h1 sm:text-display">
              You don&apos;t have to be the pioneer.
            </h1>
            <p className="max-w-xl text-h3 font-normal text-muted">{subhead}</p>
            <CtaButtons className="mt-2" />
          </div>
          <StepMotif className="mx-auto w-full max-w-sm lg:max-w-none" />
        </div>
      </section>

      {/* 2. Proof strip */}
      <section aria-labelledby="proof-title" className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between">
          <h2 id="proof-title" className="font-display text-h3">
            {years} years building for enterprise buyers
          </h2>
          <ul
            className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-small text-muted"
            aria-label="Former employers"
          >
            {facts.formerEmployers.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* 3. Why owners hold back */}
      <Section
        id="why"
        number="01"
        label="Why owners hold back"
        title="The reasons to wait are real. They're also solvable."
        intro="Owners don't hold back because AI is too new. They hold back because they're not sure it's safe, accurate or worth it."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Where does our data go?"
            body="We document every tool, what it sees and where it stores data, before anything goes live."
            sourceId="bluevine-privacy"
          />
          <StatCard
            title="Can we trust the answers?"
            body="We ground AI in your own documents, test it on real cases and keep a person in the loop."
            sourceId="bluevine-oversight"
          />
          <StatCard
            title="Where do we even start?"
            body="We start with one workflow, measure it, then scale what works."
            sourceId="goldman-training"
          />
        </div>
      </Section>

      {/* 4. Core services */}
      <Section
        id="services"
        number="02"
        label="Services"
        title="Three ways we put AI to work."
        intro="Build it, automate it, and teach your team to run it."
        className="border-t border-border"
      >
        <div className="grid gap-4 md:grid-cols-3">
          {offersInGroup("core").map((offer) => (
            <OfferCard key={offer.slug} offer={offer} showDuration={false} />
          ))}
        </div>
      </Section>

      {/* 5. The path */}
      <Section
        id="path"
        number="03"
        label="The path"
        title="One step at a time, each one smaller than you'd expect."
        intro="Every step stands on its own. You can stop after any of them."
        className="border-t border-border"
      >
        <OfferLadder />
        <p className="mt-6">
          <Link
            href="/pricing"
            className="inline-flex min-h-11 items-center font-semibold text-accent-text underline-offset-4 hover:underline"
          >
            See every offer and price
          </Link>
        </p>
      </Section>

      {/* 6. Risk off your plate */}
      <Section
        id="risk"
        number="04"
        label="Risk off your plate"
        title="We carry the delivery risk, in writing."
        className="border-t border-border"
      >
        <ul className="grid gap-4 md:grid-cols-2">
          {riskOffers.map((slug) => {
            const offer = getOffer(slug);
            return (
              <li
                key={slug}
                className="flex flex-col gap-3 rounded-card border border-border bg-surface p-6"
              >
                <h3 className="font-display text-h3">
                  <Link href={serviceHref(slug)} className="underline-offset-4 hover:underline">
                    {offer.name}
                  </Link>
                </h3>
                <ul className="flex flex-col gap-2">
                  {offer.terms.map((term) => (
                    <li key={term} className="flex gap-2">
                      <CheckIcon className="mt-1 size-5 shrink-0 text-accent-text" />
                      <span>{term}</span>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* 7. Specialty offers */}
      <Section
        id="specialty"
        number="05"
        label="Specialty offers"
        title="Focused fixes for specific problems."
        className="border-t border-border"
      >
        <div className="grid gap-4 md:grid-cols-3">
          {specialty.map((slug) => (
            <OfferCard key={slug} offer={getOffer(slug)} />
          ))}
        </div>
      </Section>

      {/* 8. About teaser */}
      <Section
        id="about"
        number="06"
        label="About"
        title="Who you'll work with."
        className="border-t border-border"
      >
        <div className="grid items-center gap-8 md:grid-cols-[1fr_2fr]">
          <Image
            src="/images/david-rhodes.jpg"
            alt={`${facts.name}, ${facts.role} of SureGround`}
            width={1600}
            height={1066}
            sizes="(min-width: 768px) 33vw, 100vw"
            className="aspect-[4/3] w-full rounded-card object-cover"
          />
          <div className="flex flex-col gap-4">
            <p className="font-display text-h3">
              {facts.name}, {facts.role}
            </p>
            <p className="text-muted">
              {years} years on the enterprise side of the table, most recently as a senior solutions
              engineer at {listJoin(facts.formerEmployers.slice(0, 3))}.
            </p>
            <p className="text-muted">
              {facts.proofPoints.find((p) => p.id === "security-reviews")?.text}
            </p>
            <p>
              <Link
                href="/about"
                className="inline-flex min-h-11 items-center font-semibold text-accent-text underline-offset-4 hover:underline"
              >
                Read David&apos;s story
              </Link>
            </p>
          </div>
        </div>
      </Section>

      {/* 9. Latest posts arrive with the blog in Phase 3. */}

      {/* 10. Final CTA */}
      <CTA />
    </>
  );
}

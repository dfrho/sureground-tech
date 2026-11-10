import type { Metadata } from "next";

import { OfferCard } from "@/components/offers/OfferCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { CTA } from "@/components/site/CTA";
import { Section } from "@/components/site/Section";
import { offerGroups, type OfferGroup } from "@/lib/config/offers";
import { groupLabels, offersInGroup } from "@/lib/offers/format";
import { breadcrumbLd } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: "Services",
  description:
    "AI engineering, agent development and AI enablement, plus fixed-scope offers to start small, pilot one workflow and keep it running.",
  alternates: { canonical: "/services" },
};

const groupIntros: Record<OfferGroup, string> = {
  core: "The three things we do: build AI into your workflows, automate back-office tasks with approval points, and train your team.",
  start: "Small first steps that give you a clear answer before you commit to a build.",
  build: "One workflow, live, on proven tools.",
  specialty: "Focused offers for specific problems.",
  operate: "Keep it working after launch.",
};

export default function ServicesPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
        ])}
      />
      {/* COPY: draft */}
      <section aria-labelledby="services-title" className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-14 sm:px-6 sm:py-18">
          <p className="font-mono text-label text-muted uppercase">Services</p>
          <h1 id="services-title" className="max-w-3xl font-display text-h1">
            AI on proven ground, one step at a time.
          </h1>
          <p className="max-w-2xl text-muted">
            Every offer has a fixed scope and a starting price. Start with the smallest step that
            answers your question.
          </p>
        </div>
      </section>

      {offerGroups.map((group, i) => (
        <Section
          key={group}
          id={group}
          number={String(i + 1).padStart(2, "0")}
          label={groupLabels[group]}
          title={groupLabels[group]}
          intro={groupIntros[group]}
          className={i > 0 ? "border-t border-border" : ""}
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {offersInGroup(group).map((offer) => (
              <OfferCard key={offer.slug} offer={offer} />
            ))}
          </div>
        </Section>
      ))}

      <CTA />
    </>
  );
}

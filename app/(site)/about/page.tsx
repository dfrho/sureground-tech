import type { Metadata } from "next";
import Image from "next/image";

import { JsonLd } from "@/components/seo/JsonLd";
import { CTA } from "@/components/site/CTA";
import { cardClass } from "@/components/site/Section";
import { facts, yearsOfExperience } from "@/content/facts";
import { breadcrumbLd, personLd } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: "About",
  description:
    "David Rhodes founded SureGround after years on the enterprise side of the table: selling, building software and answering security reviews.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const years = yearsOfExperience();
  const role = (id: string) => facts.career.find((c) => c.id === id)!;

  return (
    <>
      <JsonLd data={personLd()} />
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />
      {/* COPY: draft (David's story, first person, facts from content/facts.ts only) */}
      <section aria-labelledby="about-title" className="border-b border-border">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-18 md:grid-cols-[2fr_3fr]">
          <Image
            src="/images/david-rhodes.jpg"
            alt={`${facts.name}, ${facts.role} of SureGround`}
            width={1600}
            height={1066}
            priority
            sizes="(min-width: 768px) 40vw, 100vw"
            className="aspect-[4/3] w-full rounded-card object-cover"
          />
          <div className="flex flex-col gap-4">
            <p className="font-mono text-label text-muted uppercase">About</p>
            <h1 id="about-title" className="font-display text-h1">
              Experience from the other side of the table.
            </h1>
            <p className="text-h3 font-normal text-muted">
              {facts.name}, {facts.role} of SureGround, {facts.location}
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12 sm:px-6 sm:py-16">
        <p>
          Studying journalism and advertising at the {facts.education.school} came first, then years
          in enterprise sales for {role("sales").employer}. Those years taught me how buyers decide,
          what they worry about, and what makes them say no.
        </p>
        <p>
          After teaching myself {facts.selfTaught}, I finished {facts.bootcamp.name} in{" "}
          {facts.bootcamp.year}, and built five SaaS MVPs for startups as a freelancer. At AutoZone
          I was a senior frontend engineer on the React and TypeScript rebuild of a Fortune 500
          ecommerce site.
        </p>
        <p>
          Then I moved into solutions engineering at Shogun, FullStory and Feedonomics, with a
          stretch running my own consultancy, BloomForge, in between. Working with C-level buyers,
          security teams and global consultancies, I ran proofs of concept that had to turn into
          production deals and answered the security questions that decide whether a deal survives
          review.
        </p>
        <p>
          That is why SureGround exists. After {years} years of watching what works, I&apos;ve seen
          that the safest way to adopt AI is rarely the newest. It&apos;s a pattern that has already
          worked somewhere else, built on your own data, with a person checking the parts that
          matter.
        </p>

        <section aria-labelledby="matters-title" className="mt-4">
          <h2 id="matters-title" className="font-display text-h2">
            Why that matters
          </h2>
          <p className="mt-3 text-muted">
            Having sat across the table from CISOs and procurement teams, I know which answers
            survive a review. When I build something for your business, I build it to pass the
            questions your own customers, insurers and auditors will ask.
          </p>
        </section>

        <section aria-labelledby="record-title" className="mt-4">
          <h2 id="record-title" className="font-display text-h2">
            A few things I&apos;ve done
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {facts.proofPoints.map((p) => (
              <li key={p.id} className={cardClass}>
                {p.text}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <CTA
        title="Let's talk."
        body="Book a free AI Fit Call, or take the five-minute scorecard first."
      />
    </>
  );
}

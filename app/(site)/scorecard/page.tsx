import type { Metadata } from "next";

import { ScorecardFlow } from "@/components/scorecard/ScorecardFlow";
import { JsonLd } from "@/components/seo/JsonLd";
import { questions } from "@/content/scorecard";
import { site } from "@/lib/config/site";
import { publicEnv } from "@/lib/env.public";
import { breadcrumbLd } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: "First Step Scorecard",
  description:
    "A five-minute self-assessment for owners: see how ready your business is for AI and get a recommended first step by email.",
  alternates: { canonical: "/scorecard" },
};

const linkClass = "text-accent-text underline underline-offset-2";

export default function ScorecardPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "First Step Scorecard", path: "/scorecard" },
        ])}
      />
      {/* COPY: draft */}
      <section aria-labelledby="scorecard-title" className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-12 sm:px-6 sm:py-16">
          <p className="font-mono text-label text-muted uppercase">First Step Scorecard</p>
          <h1 id="scorecard-title" className="max-w-3xl font-display text-h1">
            How solid is your ground?
          </h1>
          <p className="max-w-2xl text-muted">
            {questions.length} quick questions across six areas, about five minutes. You get a
            score, what stands out, and a recommended first step, by email and on screen.
          </p>
          <p className="max-w-2xl text-small text-muted">
            Your answers stay in your browser until you send them, and this site keeps no copy.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <noscript>
          <p className="rounded-card border border-border bg-surface p-6">
            The scorecard needs JavaScript. You can email{" "}
            <a href={`mailto:${site.contactEmail}`} className={linkClass}>
              {site.contactEmail}
            </a>{" "}
            or book a free AI Fit Call on the{" "}
            <a href="/contact#book" className={linkClass}>
              contact page
            </a>{" "}
            instead.
          </p>
        </noscript>
        <ScorecardFlow
          siteKey={publicEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
          email={site.contactEmail}
        />
      </div>
    </>
  );
}

import type { Metadata } from "next";

import { CalEmbed } from "@/components/booking/CalEmbed";
import { ContactForm } from "@/components/forms/ContactForm";
import { JsonLd } from "@/components/seo/JsonLd";
import { site } from "@/lib/config/site";
import { publicEnv } from "@/lib/env.public";
import { getOffer } from "@/lib/offers/format";
import { breadcrumbLd } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: "Contact",
  description: "Send SureGround a message or book a free AI Fit Call with David Rhodes.",
  alternates: { canonical: "/contact" },
};

const linkClass = "text-accent-text underline underline-offset-2";

export default function ContactPage() {
  const fitCall = getOffer("fit-call");
  const calLink = publicEnv.NEXT_PUBLIC_CAL_LINK;

  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />
      {/* COPY: draft */}
      <section aria-labelledby="contact-title" className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-12 sm:px-6 sm:py-16">
          <p className="font-mono text-label text-muted uppercase">Contact</p>
          <h1 id="contact-title" className="max-w-3xl font-display text-h1">
            Let&apos;s talk.
          </h1>
          <p className="max-w-2xl text-muted">
            Send a message, or book a free {fitCall.name} below. Prefer email? Write to{" "}
            <a href={`mailto:${site.contactEmail}`} className={linkClass}>
              {site.contactEmail}
            </a>
            .
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <section aria-labelledby="message-title" className="flex flex-col gap-6">
          <div>
            <p className="font-mono text-label text-muted uppercase">01 / Message</p>
            <h2 id="message-title" className="mt-2 font-display text-h2">
              Send a message
            </h2>
            <p className="mt-3 text-muted">
              Your message goes straight to David by email. This site keeps no copy.
            </p>
          </div>
          <ContactForm
            siteKey={publicEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
            email={site.contactEmail}
          />
        </section>

        <section
          id="book"
          aria-labelledby="book-title"
          className="flex scroll-mt-24 flex-col gap-6"
        >
          <div>
            <p className="font-mono text-label text-muted uppercase">02 / Book</p>
            <h2 id="book-title" className="mt-2 font-display text-h2">
              Book a free {fitCall.name}
            </h2>
            <p className="mt-3 text-muted">{fitCall.summary}</p>
          </div>
          {calLink ? (
            <CalEmbed calLink={calLink} />
          ) : (
            <p className="rounded-card border border-border bg-surface p-6 text-muted">
              Online booking is not set up yet. Email{" "}
              <a href={`mailto:${site.contactEmail}`} className={linkClass}>
                {site.contactEmail}
              </a>{" "}
              to set up a call.
            </p>
          )}
        </section>
      </div>
    </>
  );
}

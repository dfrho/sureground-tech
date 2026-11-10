import type { Metadata } from "next";

import { ButtonLink } from "@/components/site/Button";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

// COPY: draft (listed in docs/copy-review.md)
export default function NotFound() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-28">
      <p className="font-mono text-label text-muted uppercase">404 / Not found</p>
      <h1 className="mt-4 font-display text-h1">We could not find that page.</h1>
      <p className="mt-6 max-w-xl text-muted">
        The link may be old or mistyped. If you are working out where AI fits in your business, the
        First Step Scorecard is a good place to start.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <ButtonLink href="/scorecard">Take the First Step Scorecard</ButtonLink>
        <ButtonLink href="/" variant="secondary">
          Go to the home page
        </ButtonLink>
      </div>
    </section>
  );
}

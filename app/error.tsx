"use client";

import Link from "next/link";

import { buttonClass } from "@/components/site/Button";
import { site } from "@/lib/config/site";

// Error boundary for every page below the root layout. It never shows the
// error itself: no message, digest or stack reaches the visitor (A10).
// COPY: draft (listed in docs/copy-review.md)
export default function ErrorPage({ retry }: { error: unknown; retry: () => void }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-28">
      <p className="font-mono text-label text-muted uppercase">Error / Something went wrong</p>
      <h1 className="mt-4 font-display text-h1">This page did not load.</h1>
      <p className="mt-6 max-w-xl text-muted">
        Please try again. If it keeps happening, email{" "}
        <a
          href={`mailto:${site.contactEmail}`}
          className="text-accent-text underline underline-offset-4"
        >
          {site.contactEmail}
        </a>
        .
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <button type="button" onClick={() => retry()} className={buttonClass("primary")}>
          Try again
        </button>
        <Link href="/" className={buttonClass("secondary")}>
          Go to the home page
        </Link>
      </div>
    </section>
  );
}

"use client";

import { buttonClass } from "@/components/site/Button";
import { site } from "@/lib/config/site";

import "./globals.css";

// Replaces the root layout when the layout itself fails. It renders its own
// document, follows the operating system theme through the CSS media query,
// and never shows the error itself (A10).
// COPY: draft (listed in docs/copy-review.md)
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en">
      <body>
        <title>{`Something went wrong | ${site.name}`}</title>
        <main className="mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="font-mono text-label text-muted uppercase">{site.name}</p>
          <h1 className="mt-4 font-display text-h1">Something went wrong.</h1>
          <p className="mt-6 max-w-xl text-muted">
            Please try again in a moment. If it keeps happening, email{" "}
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
            {/* A plain link: the app router may be what failed. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className={buttonClass("secondary")}>
              Go to the home page
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}

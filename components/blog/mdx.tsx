import Link from "next/link";

import { Citation } from "@/components/content/StatCard";
import { PriceTag } from "@/components/offers/PriceTag";
import { getSource, type SourceId } from "@/content/sources";
import { getOffer, type OfferSlug } from "@/lib/config/offers";
import { serviceHref } from "@/lib/offers/format";

/** A boxed note inside a post. */
export function Callout({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <aside className="rounded-card border border-border bg-surface p-5">
      {title ? <p className="font-display text-h3">{title}</p> : null}
      <div className={title ? "mt-2 text-muted" : "text-muted"}>{children}</div>
    </aside>
  );
}

/** An image with a caption. Images live in /public and are trusted repo files. */
export function Figure({
  src,
  alt,
  caption,
  width,
  height,
}: {
  src: string;
  alt: string;
  caption?: string;
  width: number;
  height: number;
}) {
  return (
    <figure className="flex flex-col gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element -- static repo image with fixed size */}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        className="h-auto w-full rounded-card border border-border"
      />
      {caption ? <figcaption className="text-small text-muted">{caption}</figcaption> : null}
    </figure>
  );
}

/** A statistic from content/sources.ts with its visible citation. */
export function Stat({ id }: { id: SourceId }) {
  const s = getSource(id);
  return (
    <figure className="rounded-card border border-border bg-surface p-5">
      <p className="font-display text-h1 text-accent-text">{s.value}</p>
      <figcaption className="mt-1 flex flex-col gap-2">
        <span>{s.claim}</span>
        <Citation id={id} />
      </figcaption>
    </figure>
  );
}

/** A link to an offer's page, with its starting price read from offers.ts. */
export function OfferLink({ slug }: { slug: OfferSlug }) {
  const offer = getOffer(slug);
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2">
      <Link href={serviceHref(slug)}>{offer.name}</Link>
      <PriceTag offer={offer} className="inline" />
    </span>
  );
}

/** Links in post bodies: external ones get rel="noopener noreferrer". */
export function MdxLink({ href = "", children, ...rest }: React.ComponentProps<"a">) {
  if (href.startsWith("/") || href.startsWith("#")) {
    return (
      <Link href={href} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} rel="noopener noreferrer" {...rest}>
      {children}
    </a>
  );
}

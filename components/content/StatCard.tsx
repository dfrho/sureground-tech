import { getSource, type SourceId } from "@/content/sources";

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** Visible citation for a statistic from content/sources.ts. */
export function Citation({ id }: { id: SourceId }) {
  const s = getSource(id);
  const who = s.via ? `${s.publisher}, via ${s.via}` : s.publisher;
  return (
    <p className="font-mono text-label text-muted">
      Source:{" "}
      <a
        href={s.url}
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-text"
      >
        {who}
      </a>
      , {dateFormat.format(new Date(s.published))}
    </p>
  );
}

/** A barrier card: heading, body and one cited number. */
export function StatCard({
  title,
  body,
  sourceId,
}: {
  title: string;
  body: string;
  sourceId: SourceId;
}) {
  const s = getSource(sourceId);
  return (
    <article className="flex h-full flex-col gap-3 rounded-card border border-border bg-surface p-6">
      <h3 className="font-display text-h3">{title}</h3>
      <p className="text-muted">{body}</p>
      <figure className="mt-auto border-t border-border pt-4">
        <p className="font-display text-h1 text-accent-text">{s.value}</p>
        <figcaption className="mt-1 flex flex-col gap-2">
          <span className="text-small">{s.claim}</span>
          <Citation id={sourceId} />
        </figcaption>
      </figure>
    </article>
  );
}

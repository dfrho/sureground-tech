/** Shared layout for the legal drafts: title, updated date and a draft notice. */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-14 sm:px-6 sm:py-18">
      <header className="flex flex-col gap-3">
        <p className="font-mono text-label text-muted uppercase">Legal</p>
        <h1 className="font-display text-h1">{title}</h1>
        <p className="font-mono text-label text-muted">Last updated {updated}</p>
        <p role="note" className="rounded-card border border-border bg-surface p-4 text-small">
          Draft. This page has not yet been reviewed by a lawyer and may change before launch.
        </p>
      </header>
      <div className="legal flex flex-col gap-4">{children}</div>
    </article>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="mt-4 font-display text-h2">{title}</h2>
      {children}
    </section>
  );
}

export const listClass = "flex list-disc flex-col gap-2 pl-6";

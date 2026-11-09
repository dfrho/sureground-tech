import { site } from "@/lib/config/site";

// Placeholder until Phase 2 builds the home page.
export default function Home() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-20 sm:px-6 sm:py-28">
      <p className="font-mono text-label text-muted">&gt; grounded_ai + enablement</p>
      <h1 className="font-display text-h1">{site.name}</h1>
      <p className="text-muted">{site.tagline}</p>
    </section>
  );
}

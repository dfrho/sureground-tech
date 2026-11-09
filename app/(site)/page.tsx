import { site } from "@/lib/config/site";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-4 px-4">
      <h1 className="text-4xl font-bold">{site.name}</h1>
      <p className="text-lg">{site.tagline}</p>
    </main>
  );
}

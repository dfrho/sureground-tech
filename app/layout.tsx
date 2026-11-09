import type { Metadata } from "next";
import { connection } from "next/server";

import { site } from "@/lib/config/site";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.tagline,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Wait for a request so every page renders per request. The nonce-based
  // CSP in proxy.ts needs this: Next.js applies the nonce while rendering.
  await connection();

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

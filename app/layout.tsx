import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { headers } from "next/headers";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { SkipLink } from "@/components/site/SkipLink";
import { ThemeProvider } from "@/components/site/ThemeProvider";
import { site } from "@/lib/config/site";
import { tokens } from "@/lib/design/tokens";

import "./globals.css";

// Fonts are committed woff2 files (latin subset, from the Fontsource npm
// packages, SIL Open Font License; see app/fonts/LICENSE-*.txt). next/font
// serves them from this site, so builds and visitors never fetch Google Fonts
// (audit OWASP-A08-001, Phase 1).
const display = localFont({
  src: [
    { path: "./fonts/space-grotesk-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./fonts/space-grotesk-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-space-grotesk",
  display: "swap",
});
const sans = localFont({
  src: [
    { path: "./fonts/ibm-plex-sans-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ibm-plex-sans-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-plex-sans",
  display: "swap",
});
const mono = localFont({
  src: [
    { path: "./fonts/ibm-plex-mono-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ibm-plex-mono-latin-500-normal.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.tagline,
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: tokens.light.bg },
    { media: "(prefers-color-scheme: dark)", color: tokens.dark.bg },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Reading the request headers renders every page per request, which the
  // nonce CSP in proxy.ts needs. The nonce also goes to next-themes so its
  // no-flash script is allowed to run.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body className="flex flex-col antialiased">
        <ThemeProvider nonce={nonce}>
          <SkipLink />
          <Header />
          <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}

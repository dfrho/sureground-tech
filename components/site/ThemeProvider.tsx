"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Light and dark mode. The theme follows the operating system by default and
 * the visitor can pick System, Light or Dark. next-themes writes `light` or
 * `dark` as a class on <html> before first paint, so there is no flash.
 */
export function ThemeProvider({
  nonce,
  children,
}: {
  nonce: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      themes={["light", "dark"]}
      nonce={nonce}
    >
      {children}
    </NextThemesProvider>
  );
}

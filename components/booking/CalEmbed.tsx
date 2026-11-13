"use client";

import Cal from "@calcom/embed-react";
import { useTheme } from "next-themes";
import { useMemo, useSyncExternalStore } from "react";

/**
 * Cal.com inline embed for the AI Fit Call. The official embed loads
 * app.cal.com/embed/embed.js from this nonce-trusted bundle ('strict-dynamic')
 * and renders an iframe from app.cal.com. embed.js injects inline <style>
 * elements, so /contact has its own CSP (lib/security/csp.ts) and every link
 * to it is a full page load.
 *
 * The iframe takes its theme when it is created, so the embed renders once
 * next-themes has resolved the theme and is remounted when it changes.
 */

const subscribe = () => () => {};

/** False during server render and hydration, true once mounted. */
function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

export function CalEmbed({ calLink }: { calLink: string }) {
  const mounted = useMounted();
  const { resolvedTheme } = useTheme();
  const theme =
    mounted && (resolvedTheme === "dark" || resolvedTheme === "light") ? resolvedTheme : null;

  const config = useMemo(
    () => (theme ? ({ layout: "month_view", theme } as const) : undefined),
    [theme],
  );

  return (
    <div
      className="min-h-[640px] w-full overflow-hidden rounded-card border border-border bg-surface"
      data-testid="cal-embed"
    >
      {theme && config ? (
        <Cal
          key={theme}
          calLink={calLink}
          config={config}
          style={{ width: "100%", height: "100%", overflow: "auto" }}
        />
      ) : null}
    </div>
  );
}

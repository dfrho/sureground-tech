"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

/**
 * Cloudflare Turnstile widget, rendered explicitly so it follows the site
 * theme. The script is added from this (nonce-trusted) bundle, which
 * 'strict-dynamic' in the CSP allows. Inside a <form>, the widget adds the
 * `cf-turnstile-response` hidden input itself. Changing `resetKey` asks for
 * a fresh token (tokens are single use).
 */

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileApi {
  render(
    el: HTMLElement,
    options: {
      sitekey: string;
      theme: "light" | "dark" | "auto";
      size?: "normal" | "flexible" | "compact";
      callback?: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
    },
  ): string;
  reset(id: string): void;
  remove(id: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<TurnstileApi> | undefined;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile"));
    script.onerror = () => {
      scriptPromise = undefined;
      reject(new Error("turnstile"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function Turnstile({
  siteKey,
  resetKey,
  onError,
}: {
  siteKey: string;
  resetKey: unknown;
  onError?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : "light";

  // Render (or re-render on theme change).
  useEffect(() => {
    let cancelled = false;
    loadTurnstile()
      .then((api) => {
        if (cancelled || !ref.current) return;
        widgetId.current = api.render(ref.current, {
          sitekey: siteKey,
          theme,
          size: "flexible",
          "error-callback": onError,
        });
      })
      .catch(() => onError?.());
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [siteKey, theme, onError]);

  // Fresh token after every submission.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
  }, [resetKey]);

  return <div ref={ref} className="min-h-[65px]" data-testid="turnstile" />;
}

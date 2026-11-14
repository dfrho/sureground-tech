/**
 * Content-Security-Policy builder, shared by proxy.ts and the unit tests.
 *
 * Scripts are allowed by per-request nonce plus 'strict-dynamic'. Next.js
 * reads the nonce from the request's CSP header and applies it to its own
 * scripts. See docs/decisions.md (CSP strategy) for why nonces were chosen
 * over the experimental SRI option.
 */

export type Integration = "turnstile" | "cal" | "vercel-analytics-dev";

type Directive =
  | "default-src"
  | "script-src"
  | "style-src"
  | "style-src-attr"
  | "img-src"
  | "font-src"
  | "connect-src"
  | "frame-src"
  | "object-src"
  | "base-uri"
  | "form-action"
  | "frame-ancestors"
  | "manifest-src"
  | "worker-src";

/** Extra sources each third-party integration needs, added only when enabled. */
export const integrationSources: Record<Integration, Partial<Record<Directive, string[]>>> = {
  turnstile: {
    "script-src": ["https://challenges.cloudflare.com"],
    "frame-src": ["https://challenges.cloudflare.com"],
    "connect-src": ["https://challenges.cloudflare.com"],
  },
  cal: {
    "script-src": ["https://app.cal.com"],
    "frame-src": ["https://app.cal.com", "https://cal.com"],
    "connect-src": ["https://app.cal.com"],
    "img-src": ["https://app.cal.com", "https://cal.com"],
  },
  // In production Vercel Analytics is served same-origin from /_vercel/insights.
  "vercel-analytics-dev": {
    "script-src": ["https://va.vercel-scripts.com"],
  },
};

/**
 * Third-party integrations are allowed only on the pages that use them.
 * Client-side navigation keeps the CSP of the first document loaded, so
 * every link to these pages is a full page load (needsFullPageLoad below,
 * used by ButtonLink, NavLink, MobileNav and Footer). See docs/decisions.md.
 */
const pageIntegrations: Record<string, readonly Integration[]> = {
  "/contact": ["turnstile", "cal"],
  "/scorecard": ["turnstile"],
};

export function integrationsForPath(pathname: string): readonly Integration[] {
  return pageIntegrations[pathname.replace(/\/+$/, "") || "/"] ?? [];
}

/** True when a link must load a new document so the target page gets its own CSP. */
export function needsFullPageLoad(href: string): boolean {
  const path = href.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  return path in pageIntegrations;
}

export interface CspOptions {
  nonce: string;
  dev?: boolean;
  integrations?: readonly Integration[];
}

const NONCE_PATTERN = /^[A-Za-z0-9+/_-]{16,}={0,2}$/;

export function buildCsp({ nonce, dev = false, integrations = [] }: CspOptions): string {
  if (!NONCE_PATTERN.test(nonce)) {
    throw new Error("CSP nonce must be base64 and at least 16 characters");
  }

  const policy: Record<Directive, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"],
    "style-src": dev ? ["'self'", "'unsafe-inline'"] : ["'self'", `'nonce-${nonce}'`],
    // React style props render as attributes, which nonces cannot cover.
    "style-src-attr": ["'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'"],
    "connect-src": ["'self'"],
    "frame-src": ["'none'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "manifest-src": ["'self'"],
    "worker-src": ["'self'"],
  };

  // React needs eval in development only, for server error stack replay.
  if (dev) policy["script-src"].push("'unsafe-eval'");

  // Cal.com's embed.js injects <style> elements without a nonce, and a nonce
  // in style-src disables 'unsafe-inline', so pages with the embed allow
  // inline styles instead. Scripts keep the nonce and 'strict-dynamic'.
  if (integrations.includes("cal")) policy["style-src"] = ["'self'", "'unsafe-inline'"];

  for (const name of integrations) {
    for (const [directive, sources] of Object.entries(integrationSources[name])) {
      const list = policy[directive as Directive];
      if (list.length === 1 && list[0] === "'none'") list.length = 0;
      for (const source of sources ?? []) if (!list.includes(source)) list.push(source);
    }
  }

  const parts = Object.entries(policy).map(([d, sources]) => `${d} ${sources.join(" ")}`);
  if (!dev) parts.push("upgrade-insecure-requests");
  return parts.join("; ");
}

/** 128-bit random nonce, base64 encoded. */
export function createNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

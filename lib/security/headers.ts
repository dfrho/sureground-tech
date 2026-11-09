/**
 * Security headers sent on every response. next.config.ts applies them to
 * all routes (including static assets) and proxy.ts applies them again with
 * the per-request CSP on pages.
 */

export interface Header {
  key: string;
  value: string;
}

export const HSTS_VALUE = "max-age=63072000; includeSubDomains";

export const PERMISSIONS_POLICY = [
  "camera=()",
  "microphone=()",
  "geolocation=()",
  "browsing-topics=()",
].join(", ");

export function securityHeaders({ dev = false }: { dev?: boolean } = {}): Header[] {
  const headers: Header[] = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Permissions-Policy", value: PERMISSIONS_POLICY },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ];
  // preload is added only after David confirms every subdomain serves HTTPS.
  if (!dev) headers.push({ key: "Strict-Transport-Security", value: HSTS_VALUE });
  return headers;
}

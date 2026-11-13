import { NextResponse, type NextRequest } from "next/server";

import { buildCsp, createNonce, integrationsForPath } from "@/lib/security/csp";
import { securityHeaders } from "@/lib/security/headers";
import { logSecurityEvent } from "@/lib/security/log";
import { checkSameOrigin } from "@/lib/security/origin";

export function proxy(request: NextRequest) {
  const dev = process.env.NODE_ENV === "development";

  const origin = checkSameOrigin(request.method, request.headers);
  if (!origin.ok) {
    logSecurityEvent("origin_rejected", {
      path: request.nextUrl.pathname,
      method: request.method,
      reason: origin.reason,
    });
    const forbidden = new NextResponse("Forbidden", { status: 403 });
    for (const { key, value } of securityHeaders({ dev })) forbidden.headers.set(key, value);
    return forbidden;
  }

  const nonce = createNonce();
  const csp = buildCsp({
    nonce,
    dev,
    integrations: integrationsForPath(request.nextUrl.pathname),
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  for (const { key, value } of securityHeaders({ dev })) response.headers.set(key, value);
  return response;
}

export const config = {
  matcher: [
    // Everything except build assets and image optimization; those still get
    // the static security headers from next.config.ts. There is deliberately
    // no `missing` clause for prefetch headers: a request could set one to
    // skip the origin check (audit 2026-11-09, OWASP-A01-001).
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

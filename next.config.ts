import type { NextConfig } from "next";

import { securityHeaders } from "./lib/security/headers";

const dev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  reactStrictMode: true,
  // cacheComponents (Partial Prerendering) is off: it is incompatible with
  // the per-request CSP nonces in proxy.ts. See docs/decisions.md.
  experimental: {
    serverActions: {
      // Same origin only. No extra hosts are listed, so Next.js accepts
      // actions only when Origin matches the deployment's own host.
      allowedOrigins: [],
      bodySizeLimit: "64kb",
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders({ dev }) }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

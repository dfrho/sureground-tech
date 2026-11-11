import { headers } from "next/headers";

import { serializeJsonLd } from "@/lib/seo/jsonld";

/**
 * Structured data block. The only dangerouslySetInnerHTML in the project:
 * the data is built from repo constants and serialized with "<" escaped.
 * It carries the CSP nonce so the policy never flags it.
 */
export async function JsonLd({ data }: { data: unknown }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      // eslint-disable-next-line react/no-danger -- escaped JSON-LD only, see lib/seo/jsonld.ts
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}

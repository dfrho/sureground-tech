# Security audit: Phase 2 (marketing pages), 2026-11-10

- **Date:** 2026-11-10
- **Standard:** OWASP Top 10:2025
- **Why:** CLAUDE.md requires an audit at the end of every phase, scoped to the files that phase changed. Phase 2 does not touch `proxy.ts`, `next.config.ts`, `lib/security/`, `lib/forms/`, `lib/email/` or `app/actions/`, so a full audit is not required.
- **Method:** static review. The branch's unit tests (71) and Playwright suite (438, against a production build with the real CSP) were run before the audit and are cited as supporting evidence.
- **Scope (branch `p2/marketing-pages`):** `app/(site)/page.tsx`, `app/(site)/services/page.tsx`, `app/(site)/services/[slug]/page.tsx`, `app/(site)/pricing/page.tsx`, `app/(site)/about/page.tsx`, `app/(site)/legal/{privacy,terms}/page.tsx`, `app/sitemap.ts`, `app/robots.ts`, `app/globals.css`, `components/seo/JsonLd.tsx`, `components/offers/*`, `components/content/*`, `components/site/{Section,CTA,icons}.tsx`, `components/brand/StepMotif.tsx`, `content/facts.ts`, `content/sources.ts`, `content/services/*`, `lib/offers/format.ts`, `lib/seo/jsonld.ts`, `tests/**`.

## Summary

Phase 2 adds server-rendered marketing pages built entirely from repository constants. No new page reads request input: no search params, cookies, form data, route handlers that accept a body, or outbound requests. The only dynamic segment, `/services/[slug]`, is limited to the slugs in `offers.ts`. The one raw HTML sink, JSON-LD, takes only repo constants and escapes them.

No findings.

| Severity      | New |
| ------------- | --- |
| Critical      | 0   |
| High          | 0   |
| Medium        | 0   |
| Low           | 0   |
| Informational | 0   |

The two Informational items accepted in Phase 1 (OWASP-A03-001, OWASP-A08-001) are unchanged; this phase adds no dependencies.

## Execution context

| Area                                                      | Context                                                 |
| --------------------------------------------------------- | ------------------------------------------------------- |
| All Phase 2 pages, `JsonLd`, `sitemap.ts`, `robots.ts`    | Server (React Server Components, rendered per request)  |
| `content/**`, `lib/offers/format.ts`, `lib/seo/jsonld.ts` | Server, imported at build and render; no `"use client"` |
| `StepMotif`, offer and content components                 | Server-rendered markup; no client JavaScript added      |
| `tests/**`                                                | CI and local only                                       |

## What was checked

- **Dynamic route (A01).** `app/(site)/services/[slug]/page.tsx` sets `dynamicParams = false` and builds `generateStaticParams` from `content/services`, whose module-load check requires every entry to match an offer in `offers.ts`. Unknown slugs return 404 (Playwright: "an unknown service slug is a 404"). The slug is only compared against constants; it never reaches a file path, URL or query.
- **No redirects or server fetches (A01).** No `redirect()`, `fetch()` or URL built from input in scope.
- **JSON-LD (A05).** `components/seo/JsonLd.tsx` is the only `dangerouslySetInnerHTML`, allowed by an inline ESLint exception with a reason; `react/no-danger` stays an error elsewhere. Its data comes from `lib/seo/jsonld.ts` builders that read `site.ts`, `facts.ts` and `offers.ts` only. `serializeJsonLd` escapes `<`, U+2028 and U+2029, so no value can close the script element; a unit test feeds it `</script><script>` and checks the output. The script carries the request nonce, and Playwright reports no CSP violations on `/`, `/services/pilot-sprint`, `/pricing` and `/about`.
- **Other rendering (A05).** All other text goes through React escaping. External links (source citations, LinkedIn) are plain anchors without `target="_blank"` and carry `rel="noopener noreferrer"` or `rel="me noopener"`. Citation URLs are validated as `https:` by the Zod schema in `content/sources.ts`.
- **No inline styles added (A02).** The stepped ladder uses classes rather than a `style` attribute; the step motif animation is in `globals.css`.
- **Personal data (A04, privacy guardrail).** `content/facts.ts` holds no phone number, personal email, home address or personal profile URL; a unit test blocks phone-number patterns, `@`, `linkedin.com/in/` and "present/current". The resume itself is not in the repository. The headshot was stripped of metadata in Phase 1.
- **Exceptional conditions (A10).** Content mismatches (unknown proof point or offer slug) throw at module load, so a bad content edit fails the build instead of rendering a broken page. The non-null assertions in the service page rely on that check. `notFound()` covers a missing offer.
- **Sitemap and robots (A02).** Both list only static public paths. Non-production hosts still receive `X-Robots-Tag: noindex` from `next.config.ts`.

## Coverage

| Category                       | Status         | Notes                                                                                  |
| ------------------------------ | -------------- | -------------------------------------------------------------------------------------- |
| A01 Broken Access Control      | Assessed       | One dynamic segment, closed to known slugs. No auth, redirects or server-side fetches. |
| A02 Security Misconfiguration  | Assessed       | No config changes. No inline styles or scripts beyond the nonce-carrying JSON-LD.      |
| A03 Software Supply Chain      | Assessed       | No new dependencies; `pnpm audit:deps` reports no known vulnerabilities.               |
| A04 Cryptographic Failures     | Assessed       | No secrets or crypto in scope. Personal-data rule checked by unit test.                |
| A05 Injection                  | Assessed       | JSON-LD escaped and tested; everything else React-escaped.                             |
| A06 Insecure Design            | Not applicable | No forms or workflows in this phase.                                                   |
| A07 Authentication Failures    | Not applicable | No authentication.                                                                     |
| A08 Software or Data Integrity | Assessed       | No deserialization of external data. Content is validated with Zod at module load.     |
| A09 Logging and Alerting       | Not applicable | No new security events; no logging added.                                              |
| A10 Exceptional Conditions     | Assessed       | Content errors fail the build; unknown slugs 404.                                      |

## Limitations

- Static review of the listed files only; the Phase 1 controls (`proxy.ts`, headers, CSP builder) were not re-reviewed because they did not change.
- The legal drafts describe Phase 4 and 5 behavior (hashed rate-limit keys in Upstash, no stored submissions, no AI model in the scorecard). Those statements must be checked against the code when Phase 4 and 5 ship, and the privacy policy needs a lawyer's review before launch.
- Deployed behavior on Vercel is confirmed after the branch deploys, not here.

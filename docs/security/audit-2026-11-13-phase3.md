# Security audit: Phase 3 (blog), 2026-11-13

- **Date:** 2026-11-13
- **Standard:** OWASP Top 10:2025, all ten categories
- **Why a full audit:** CLAUDE.md requires one before any release that touches `next.config.ts`, and Phase 3 wraps the config with `@next/mdx`.
- **Method:** static review. The branch's unit tests (85) and Playwright suite (522, against a production build with the real CSP and headers) were run and are cited as supporting evidence. No other code was executed for the audit.
- **Scope (branch `p3/blog`):** `next.config.ts`, `mdx-components.tsx`, `package.json` and `pnpm-lock.yaml` (new: `@next/mdx` 16.4.5, `@mdx-js/loader` 3.1.1, `@mdx-js/react` 3.1.1, `@types/mdx` 2.0.14), `lib/blog/{schema,posts,content,xml}.ts`, `content/blog/*`, `components/blog/*`, `app/(site)/blog/**`, `app/blog/rss.xml/route.ts`, `app/sitemap.ts`, `app/(site)/page.tsx`, `lib/seo/jsonld.ts`, `app/globals.css`, `tests/**`. Unchanged controls re-checked at a high level: `proxy.ts`, `lib/security/*`, the `headers()` block in `next.config.ts`.

## Summary

Phase 3 adds a blog compiled from MDX files in the repository. No new page reads request input beyond route segments, and every segment is closed to values from `content/blog/posts.ts`. There are no forms, no outbound requests, no new secrets and no new security events.

One Low finding was found and fixed during the audit: the Open Graph image route rendered a fresh image for any slug.

| Severity      | New | Open after fixes |
| ------------- | --- | ---------------- |
| Critical      | 0   | 0                |
| High          | 0   | 0                |
| Medium        | 0   | 0                |
| Low           | 1   | 0                |
| Informational | 0   | 0                |

The two Informational items accepted in Phase 1 (OWASP-A03-001, OWASP-A08-001) are unchanged.

## Execution context

| Area                                                                | Context                                                        |
| ------------------------------------------------------------------- | -------------------------------------------------------------- |
| `app/(site)/blog/**` pages, `mdx-components.tsx`, `components/blog` | Server (React Server Components, rendered per request for CSP) |
| `[slug]/opengraph-image.tsx`                                        | Server route returning a PNG                                   |
| `app/blog/rss.xml/route.ts`                                         | Server route, `force-static` (built once)                      |
| `lib/blog/*`, `content/blog/*`                                      | Server and build; `lib/blog/content.ts` is `server-only`       |
| MDX compilation (`@next/mdx`, `@mdx-js/loader`)                     | Build only, on repository files                                |
| `tests/**`                                                          | CI and local only                                              |

## Findings

### A06 Insecure Design

#### OWASP-A06-001: Open Graph image rendered for any slug (fixed)

- **CWE:** none of A06's mapped CWEs fits exactly; the closest MITRE entry, CWE-770 (Allocation of Resources Without Limits or Throttling), is not in A06's mapped list, so the finding is left unlabelled rather than misfiled.
- **Severity:** Low. An anonymous request to `/blog/<anything>/opengraph-image-<id>` made the server render a PNG, so each new URL cost CPU time. The response showed only the generic "SureGround" title (no request text was reflected), and Vercel's platform DDoS protection sits in front.
- **Confidence:** High. Reproduced against the dev server: an unknown slug returned 200 with `image/png`.
- **Location:** `app/(site)/blog/[slug]/opengraph-image.tsx`. Before the fix, `getPost(slug)` returning `undefined` fell back to `title = "SureGround"` and rendered.
- **Entry point and path:** the URL segment `slug` went to `getPost()` (a lookup in a constant list, safe) and then to `new ImageResponse(...)`. `dynamicParams = false` in the sibling `page.tsx` does not apply to the image route.
- **Fix applied:** the image route now sets `dynamicParams = false` and calls `notFound()` when the post does not exist. `tests/e2e/blog.spec.ts` ("the Open Graph image route is limited to real posts") checks that an unknown slug returns 404 in a production build.

## What was checked

- **A01 Broken Access Control.** Every new dynamic segment (`/blog/[slug]`, `/blog/page/[page]`, `/blog/tag/[tag]`, and now the OG image) sets `dynamicParams = false` and builds `generateStaticParams` from `content/blog/posts.ts`. `loadPostBody(slug)` in `lib/blog/content.ts` runs only after `getPost(slug)` has matched a registry entry, and its import is limited by the bundler to `content/blog/*.mdx`. A URL-encoded traversal attempt reached no file. Drafts are excluded from production by `includeDrafts()` (`VERCEL_ENV`, then `NODE_ENV`) and return 404 there (Playwright). Previews show drafts, behind Vercel deployment protection. No redirects, no server-side fetches.
- **A02 Security Misconfiguration.** `createMDX` spreads the existing config, so `headers()`, `poweredByHeader: false`, `productionBrowserSourceMaps: false` and the Server Actions settings are kept. The Playwright security suite confirms the headers and a violation-free CSP on `/blog` and the post page. The RSS response sets its own `Content-Type`; the proxy adds the security headers. Non-production hosts keep `X-Robots-Tag: noindex`, and draft posts also set `robots: noindex`.
- **A03 Software Supply Chain.** Four new packages, all pinned to exact versions (`saveExact: true`), installed through the committed lockfile, with no install scripts needed (`allowBuilds` unchanged). `pnpm audit --prod --audit-level=high` reports no known vulnerabilities. `@next/mdx` comes from the Next.js team at the same version as `next`; `@mdx-js/*` are the MDX project's own packages. Dependabot covers them.
- **A04 Cryptographic Failures.** No secrets, keys or cryptography in scope. Posts contain no personal data.
- **A05 Injection.** MDX is compiled only from repository files at build time, never from request input, with no remark or rehype plugins. React escapes all rendered text. External links get `rel="noopener noreferrer"` from `MdxLink`. The RSS feed escapes every value with `xmlEscape` (unit tested). The new `blogPostingLd` builder goes through the existing escaped `serializeJsonLd`; `JsonLd.tsx` is still the only `dangerouslySetInnerHTML`.
- **A06 Insecure Design.** No forms or workflows. The OG image issue above is fixed.
- **A07 Authentication Failures.** Not applicable: no authentication.
- **A08 Software or Data Integrity.** Post metadata is validated with Zod at module load, so bad metadata fails the build. No deserialization of external data.
- **A09 Logging and Alerting.** No new security-relevant events, and no logging added.
- **A10 Exceptional Conditions.** Unknown slugs, tags and page numbers return 404 through `notFound()`. A failed MDX import would throw to `error.tsx`, which shows no internal details.

## Coverage

| Category                       | Status         | Notes                                                                   |
| ------------------------------ | -------------- | ----------------------------------------------------------------------- |
| A01 Broken Access Control      | Assessed       | All segments closed to registry values; drafts gated by environment.    |
| A02 Security Misconfiguration  | Assessed       | Config wrapper keeps headers; CSP verified on blog pages by Playwright. |
| A03 Software Supply Chain      | Assessed       | Four pinned packages, lockfile, audit clean.                            |
| A04 Cryptographic Failures     | Assessed       | Nothing in scope.                                                       |
| A05 Injection                  | Assessed       | MDX from repo only; RSS and JSON-LD escaped.                            |
| A06 Insecure Design            | Assessed       | One Low, fixed.                                                         |
| A07 Authentication Failures    | Not applicable | No authentication.                                                      |
| A08 Software or Data Integrity | Assessed       | Zod validation at load; no untrusted deserialization.                   |
| A09 Logging and Alerting       | Assessed       | No new events.                                                          |
| A10 Exceptional Conditions     | Assessed       | 404s for unknown values; generic error page.                            |

## Limitations

- Static review; the deployed headers and the Vercel preview protection were not re-checked live.
- `pnpm audit` reflects the advisory database on the audit date only.
- Post content is trusted because only David and this repository's maintainers can change it. That trust depends on GitHub branch protection and review, which this audit did not re-check.

# Security audit: Phase 1 (design system and shell)

- **Date:** 2026-11-09
- **Standard:** OWASP Top 10:2025
- **Method:** static review only. No project code was executed for the audit. The Phase 1 test runs (unit and Playwright) happened before the audit as part of the phase work and are cited as supporting evidence only.
- **Scope:** commits `d2fb99a` and `2bc3fab` on branch `p1/design-shell`: `app/layout.tsx`, `app/globals.css`, `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx`, `app/icon.svg`, `app/(site)/page.tsx`, `components/**`, `lib/config/site.ts`, `lib/config/offers.ts`, `lib/design/tokens.ts`, `package.json` and `pnpm-lock.yaml` (new dependency `next-themes` 0.4.6), `.github/workflows/ci.yml` (new artifact upload step), and the new and changed tests.
- **Categories:** A01, A02, A03, A05, A08, A10. A04, A06, A07 and A09 were not in scope: Phase 1 adds no forms, secrets, authentication or logging.

## Summary

Phase 1 adds presentational server components, four small client components (theme provider, theme toggle, nav link, mobile nav) and one third-party runtime dependency. It has no server actions, route handlers, user input, redirects or outbound requests. No exploitable issue was found.

| Severity      | Count |
| ------------- | ----- |
| Critical      | 0     |
| High          | 0     |
| Medium        | 0     |
| Low           | 0     |
| Informational | 2     |

Both informational items have high confidence, and both are accepted with a reason in `docs/decisions.md`.

## Execution context

| File                                                                                    | Context                                                     |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `app/layout.tsx`, `app/not-found.tsx`, `app/(site)/page.tsx`                            | Server (React Server Components, rendered per request)      |
| `components/brand/*`, `Header`, `Footer`, `Button`, `SkipLink`, `icons`                 | Server components (no `"use client"`)                       |
| `ThemeProvider`, `ThemeToggle`, `NavLink`, `MobileNav`, `app/error.tsx`, `global-error` | Browser (client components), also server-rendered once      |
| `next-themes` inline script                                                             | Browser, runs during HTML parsing before hydration          |
| `next/font/google`                                                                      | Build (downloads font files); fonts then served same-origin |
| `.github/workflows/ci.yml`                                                              | CI                                                          |

## Findings

### A03 Software Supply Chain Failures

#### OWASP-A03-001: `next-themes` has an infrequent release cadence (Informational)

- **CWE:** [CWE-1104](https://cwe.mitre.org/data/definitions/1104.html) Use of Unmaintained Third Party Components (a maintenance signal only, not a confirmed issue)
- **Severity:** Informational. There is no known vulnerability; the risk is slower fixes if one is found.
- **Confidence:** High for the facts below. Upstream maintainer activity was not checked (no network lookups during the audit).
- **Location:** `package.json` `dependencies.next-themes: "0.4.6"`; `pnpm-lock.yaml` line 2060 (integrity hash present).
- **Evidence:** 0.4.6 was published in March 2025, and the only later release is a `1.0.0-beta.0`. The package has no runtime dependencies and no install-time lifecycle scripts: its `prepublish` script runs only on the maintainer's machine. `pnpm audit:deps` reports no known vulnerabilities.
- **Reachability:** the package runs in the browser on every page. Its inline script is built from static provider props (`attribute`, `storageKey`, `defaultTheme`, `themes`) through `JSON.stringify`; no request data reaches it. The only runtime input is the `theme` key in the visitor's own `localStorage`, which it passes to `classList.add`. That is a DOM class name, not markup, so there is no injection sink.
- **Mitigations checked:** exact version pin, lockfile integrity hash, Dependabot weekly updates with a 7-day cooldown, `pnpm audit:deps` in CI, and the nonce CSP with `'strict-dynamic'`. The Playwright test that checks every script for the current nonce passes, so the inline script carries the nonce.
- **Fix or decision:** keep the dependency. It is on the locked stack in CLAUDE.md, and replacing it with a hand-written script would trade one small risk for another. Re-evaluate if 1.0 ships or an advisory appears.
- **References:** [A03:2025](https://owasp.org/Top10/2025/A03_2025-Software_Supply_Chain_Failures/), [OWASP Vulnerable Dependency Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Vulnerable_Dependency_Management_Cheat_Sheet.html)

### A08 Software or Data Integrity Failures

#### OWASP-A08-001: Google Fonts are downloaded at build time without a fixed checksum (Informational)

- **CWE:** [CWE-494](https://cwe.mitre.org/data/definitions/494.html) Download of Code Without Integrity Check (applied loosely: the downloads are font files, not code)
- **Severity:** Informational. Font files are data. A tampered font could only matter through a browser font-parser bug, and the download comes from Google's own font servers over HTTPS.
- **Confidence:** High.
- **Location:** `app/layout.tsx` lines 16-33 (`Space_Grotesk`, `IBM_Plex_Sans` and `IBM_Plex_Mono` from `next/font/google`).
- **Evidence:** `next/font/google` fetches the stylesheet and `woff2` files from Google Fonts during `next build`, then serves them from `/_next/static/media/`. Nothing in the repo records a hash of the expected files.
- **Reachability:** only during builds on Vercel or CI. Visitors never contact Google: `font-src 'self'` in the CSP and the Playwright request log both show fonts served from the same origin.
- **Mitigations checked:** HTTPS to Google, same-origin serving at runtime, and a CSP that blocks third-party font hosts.
- **Fix or decision:** accepted for now. The stack specifies `next/font` self-hosting, and these fonts are on Google Fonts. To remove the build-time download completely, commit the `woff2` files and switch to `next/font/local`; that also removes the build's network dependency. Owner: Claude, revisit in Phase 6 (launch hardening).
- **References:** [A08:2025](https://owasp.org/Top10/2025/A08_2025-Software_or_Data_Integrity_Failures/)

## Coverage

| Category                       | Status   | Notes                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A01 Broken Access Control      | Assessed | No new routes accept input. Every link target is a constant from `lib/config/site.ts`, so there are no open redirects. `NavLink` only compares `usePathname()` with constants. No server code makes outbound requests. The proxy origin check is unchanged.                                                                                                                                                                   |
| A02 Security Misconfiguration  | Assessed | Headers and CSP are unchanged. No `dangerouslySetInnerHTML` in project code; `react/no-danger` lint passes. No `target="_blank"` links. `global-error.tsx` adds no debug output. The CI artifact upload (`actions/upload-artifact`, SHA-pinned v7.0.2, `if: always()`) uploads only `test-results/*/*.png` screenshots of a local test build. The workflow keeps `permissions: contents: read` and has no repository secrets. |
| A03 Software Supply Chain      | Assessed | One new runtime dependency (OWASP-A03-001). No new install scripts; `pnpm-workspace.yaml` `allowBuilds` is unchanged. The new Action is pinned to a full commit SHA.                                                                                                                                                                                                                                                          |
| A05 Injection                  | Assessed | All rendered text is React-escaped constants. The only inline script is next-themes' own, built from static props (see OWASP-A03-001). `mailto:` and LinkedIn `href` values come from config, not from input.                                                                                                                                                                                                                 |
| A08 Software or Data Integrity | Assessed | OWASP-A08-001. No deserialization of untrusted data. `localStorage` holds only the theme name, read by next-themes into `classList`.                                                                                                                                                                                                                                                                                          |
| A10 Exceptional Conditions     | Assessed | `app/error.tsx` and `app/global-error.tsx` accept `error` but never render it: no message, digest or stack reaches the page. Both offer retry and a link home. No new `try/catch` in project code; next-themes' `catch` around `localStorage` fails safe to the system theme.                                                                                                                                                 |

## Other changes reviewed

- `lib/config/offers.ts`: every offer is now `confirmed: true`, recorded as David's approval on 2026-11-09. This is a data change with no security effect. `check:offers` now passes, which removes one of the two gates that block production builds; the env check still blocks them until the production variables are set.
- `localStorage` key `theme` holds no personal data. It is a per-browser preference, consistent with CLAUDE.md, which bans storing scorecard answers in local storage, not preferences.

## Limitations

- Static review. Deployed headers were not re-checked on a Vercel preview for this phase; they are unchanged from Phase 0 and covered by the Playwright security spec against a production build.
- No vulnerability database lookups beyond `pnpm audit` (run as part of the phase checks, not the audit).
- Upstream maintenance of `next-themes` and the integrity of Google Fonts files were not verified.

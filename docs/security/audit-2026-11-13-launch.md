# Security audit: pre-launch (Phase 6)

- **Date:** 2026-11-13
- **Branch:** `p6/launch-hardening` (against `main` at 5c21ab4, Phase 5 merged)
- **Standard:** OWASP Top 10:2025, all ten categories, whole site (the pre-launch full audit required by CLAUDE.md)
- **Method:** static review of the source, plus `pnpm audit --prod --audit-level=high` (a project script CLAUDE.md requires) and a DNS lookup of the public DMARC record. No scanners, no probing of the deployed site. The deployed headers are checked separately with securityheaders.com in Phase 6.
- **Execution context:**
  - Server: `proxy.ts` (runs on every page request), `app/actions/*` (Server Actions), `lib/forms/*`, `lib/email/*`, `lib/rate-limit.ts`, `lib/security/*`, `lib/env*.ts`, `emails/*`, the route handlers (`.well-known/security.txt`, `blog/rss.xml`), Open Graph images, and Server Components.
  - Build: `next.config.ts`, the MDX pipeline (repo files only), `scripts/*`, `vercel.json`.
  - CI: `.github/workflows/ci.yml`, Dependabot.
  - Browser: the `"use client"` components (`Turnstile`, `CalEmbed`, `ContactForm`, `EmailGate`, `ScorecardFlow`, `NavLink`, `MobileNav`, `ThemeToggle`, `ThemeProvider`, `error.tsx`, `global-error.tsx`).

## Summary

This is a brochure site with no login, no database and no stored personal data. It has two write paths, the contact form and the First Step Scorecard. Both run one shared pipeline in this order:

1. The proxy rejects any POST unless its Origin matches the host (fails closed), and Next.js runs its own Server Action origin check (`allowedOrigins: []`).
2. Turnstile (fails closed on errors and timeouts, checks the hostname in production).
3. The honeypot.
4. Upstash rate limits keyed by salted SHA-256 hashes (they fail closed on errors and timeouts).
5. Zod validation with length limits and enums.
6. The send. A success is shown only after Resend accepts every email.

Every finding from earlier audits stays fixed:

- The prefetch-header bypass of the origin check (Phase 0)
- The public dev salt (Phase 4)
- `+tag` emails sidestepping the email rate limit (Phase 5)

No new Critical, High, Medium or Low findings. Two Informational items concern the domain and DNS, not the code. They are tracked in the launch checklist.

| Severity      | Count | Status                                 |
| ------------- | ----- | -------------------------------------- |
| Critical      | 0     |                                        |
| High          | 0     |                                        |
| Medium        | 0     |                                        |
| Low           | 0     |                                        |
| Informational | 2     | Tracked in `docs/launch-checklist.md`  |

Both Informational items have High confidence: the facts were read directly from the configuration and the public DNS record.

## Findings

### A02: Security Misconfiguration

#### Informational: DMARC policy is `p=none`

- **Evidence:** the public record `_dmarc.sureground.tech` is `v=DMARC1; p=none;` (checked with `dig`, 2026-11-13).
- **What it means:** receiving mail servers report spoofed mail claiming to be from sureground.tech but still deliver it. SPF and DKIM are in place for Google Workspace and for Resend's `send` subdomain. `p=none` is the usual first step while the senders settle. No `rua` address is set, so no reports arrive either.
- **Recommendation:** after two to four weeks of normal sending, move to `p=quarantine`, then later to `p=reject`. Add a `rua=mailto:` reporting address first if David wants the reports. Owner: David. This is tracked in the launch checklist as a post-launch item.

#### Informational: HSTS `includeSubDomains` covers every subdomain

- **Evidence:** `lib/security/headers.ts`, `HSTS_VALUE = "max-age=63072000; includeSubDomains"`. This takes effect on sureground.tech once DNS points to Vercel.
- **What it means:** after a browser visits sureground.tech, it refuses plain HTTP on every subdomain for two years. The subdomains known today are DNS records for email only (`send`, `resend._domainkey.send`, `google._domainkey`, `_dmarc`), and no web pages are served from them. A subdomain added later must serve HTTPS. `preload` stays off until David confirms that (CLAUDE.md A02).
- **Owner:** David. Confirm there are no HTTP-only subdomains in Squarespace DNS during the cutover. This is already in the launch checklist.

## Coverage by category

| Category | Status | Notes |
| --- | --- | --- |
| A01 Broken Access Control | Assessed | No auth surfaces and no user objects. Dynamic routes (`blog/[slug]`, `blog/page/[page]`, `blog/tag/[tag]`, `services/[slug]`, the blog Open Graph image) all set `dynamicParams = false`, so only repo slugs resolve. There are no `redirect()` calls and no server fetch of a user-supplied URL; Turnstile's siteverify URL is a constant. `services/[slug]` reads one query value (`from`), only compares it to the literal `"scorecard"` and never reflects or redirects with it. CSRF: Server Actions are protected by `checkSameOrigin` in `proxy.ts` (fails closed on a missing or mismatched Origin, and covers every path except static assets) and by Next.js's own action origin check. |
| A02 Security Misconfiguration | Assessed | Headers come from `next.config.ts` (every path) and again from `proxy.ts` (pages, with the per-request CSP): HSTS, nosniff, Referrer-Policy, X-Frame-Options DENY, Permissions-Policy, COOP. The CSP uses a nonce with `'strict-dynamic'`, no `'unsafe-eval'` in production, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` and `frame-ancestors 'none'`. Third-party hosts are allowed only on `/contact` and `/scorecard`. `'unsafe-inline'` for styles is limited to `/contact` (Cal.com) and to `style-src-attr` (React style props). Also set: `poweredByHeader: false` and no production browser source maps. Every host except sureground.tech gets `X-Robots-Tag: noindex`. Two Informational items are above. |
| A03 Software Supply Chain | Assessed | Exact versions (`saveExact`), committed lockfile, `--frozen-lockfile` on Vercel and in CI, and no package may run install scripts (`allowBuilds` all false). `minimumReleaseAge` is one day; Dependabot is on with a cooldown. GitHub Actions are pinned to commit SHAs, `permissions: contents: read`, `persist-credentials: false`. `pnpm audit --prod --audit-level=high`: no known vulnerabilities. |
| A04 Cryptographic Failures | Assessed | HTTPS via Vercel plus HSTS. Rate-limit keys are salted SHA-256 hashes of the IP and the normalized email. The salt is a secret per environment, and the public dev salt can never reach Upstash. CSP nonces are 128 bits from `crypto.getRandomValues`. Secrets live only in Vercel and `.env.local`: `.env.example` lists names only, `lib/env.ts` is `server-only`, and `lib/env.public.ts` exposes only `NEXT_PUBLIC_*`. No secret values were found in tracked files. |
| A05 Injection | Assessed | No SQL or shell, and no `eval`. The only `dangerouslySetInnerHTML` is JSON-LD built from repo constants, through `serializeJsonLd`, which escapes `<`, U+2028 and U+2029. RSS escapes every value with `xmlEscape`. Emails are React Email components (escaped). Subjects and Reply-To pass through `headerSafe`, which strips CR, LF and other control characters, and Reply-To is always a Zod-validated email or a constant. MDX compiles only from `content/blog`, with no plugins. |
| A06 Insecure Design | Assessed | Both forms: Turnstile, honeypot, per-IP limits (contact 5 per hour; scorecard 5 per 10 minutes), a scorecard per-inbox limit (3 per day, `+tags` normalized), length limits on every field and a 64 KB action body limit. Scorecard answers are enums, and the score is recomputed on the server. The result email to a visitor-typed address carries only fixed text and the score (abuse rule, unit tested). |
| A07 Authentication Failures | Assessed | No site authentication. MFA on the operator's accounts is tracked in `docs/launch-checklist.md`; GitHub, Resend, Cloudflare, Upstash, Cal.com, Google Workspace and the registrar are still open there. |
| A08 Software or Data Integrity | Assessed | Form data is read as strings and validated by Zod; there is no deserialization of untrusted data beyond Resend and Cloudflare JSON responses, which are only checked for `success`, `error` and `hostname`. Third-party scripts (Turnstile, Cal.com) load only from CSP-allowed hosts, from nonce-trusted bundles. There are no webhooks. CI actions are SHA-pinned. |
| A09 Logging and Alerting | Assessed | Security events (origin rejections, Turnstile failures, honeypot hits, rate-limit blocks, validation failures by field name, send failures, form errors) are logged as JSON through a helper with a fixed key allowlist, so it cannot log names, emails, bodies or raw IPs. Resend errors log the error code only. Rate-limit blocks, send failures and form errors raise one alert email per hour to David at their thresholds. |
| A10 Exceptional Conditions | Assessed | Both actions wrap everything in try/catch and return a generic message with the visitor's own values. `sendEmail` never throws. Turnstile, the limiter and a missing salt all fail closed, and a missing production variable fails the build or the request. `error.tsx` and `global-error.tsx` never show the error, digest or stack. |

## Launch notes (not findings)

- **Turnstile hostname check.** In production, Turnstile tokens must come from `sureground.tech` or `www.sureground.tech` (`site.productionHosts`). Until DNS points to Vercel, form posts on `sureground-tech.vercel.app` are rejected as `bad-hostname`. That is the intended fail-closed behavior. After the cutover, send one contact message and one scorecard on sureground.tech to confirm, and check that the Turnstile widget's hostname list in Cloudflare includes sureground.tech.
- **`x-forwarded-host` trust.** The origin check compares Origin to `x-forwarded-host`, which Vercel sets. Running behind another proxy would need this re-checked. Next.js's own action origin check is a second layer.

## Limitations

- Static review. Deployed headers are confirmed by the securityheaders.com check, not here. Vercel firewall settings and Upstash behavior under load were not observed.
- Delivery behavior at Resend and recipients' providers was not exercised beyond David's preview test send.
- Account MFA and DNS settings outside the DMARC record are reported by David, not verified.
- Provider-specific email aliases beyond `+tags` (for example dots in Gmail addresses) are not normalized. This was accepted in the Phase 5 audit.

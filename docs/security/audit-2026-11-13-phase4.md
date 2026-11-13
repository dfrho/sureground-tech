# Security audit: Phase 4 (contact and booking), 2026-11-13

- **Date:** 2026-11-13
- **Standard:** OWASP Top 10:2025, all ten categories
- **Why a full audit:** CLAUDE.md requires one before any release that touches `app/actions/`, `lib/forms/`, `lib/email/`, `proxy.ts` or `lib/security/`. Phase 4 touches all five.
- **Method:** static review of the scope below. Supporting evidence: the branch's unit tests (Vitest) and Playwright suite, run against a production build with the real CSP and headers, Cloudflare's public Turnstile test keys, the email outbox and Cal.com's public demo booking page. No other code was executed for the audit.
- **Scope (branch `p4/contact-booking`):** `app/actions/contact.ts`, `lib/forms/{contact-schema,pipeline,turnstile,hash}.ts`, `lib/rate-limit.ts`, `lib/email/send.ts`, `emails/{layout,ContactNotify}.tsx`, `lib/security/{alert,csp,log}.ts`, `proxy.ts`, `lib/env.schema.ts`, `components/forms/*`, `components/booking/CalEmbed.tsx`, `components/site/{Button,MobileNav,Footer}.tsx`, `app/(site)/contact/page.tsx`, `app/sitemap.ts`, `package.json` and `pnpm-lock.yaml` (new: `resend` 6.38.0, `@react-email/render` 2.3.1, `@upstash/ratelimit` 2.2.1, `@upstash/redis` 1.41.0, `@calcom/embed-react` 1.5.3), `playwright.config.ts`, `tests/**`. Unchanged controls re-checked at a high level: `next.config.ts` (Server Actions `allowedOrigins: []`, `bodySizeLimit: "64kb"`), `lib/security/origin.ts`, `lib/security/headers.ts`.

## Summary

Phase 4 adds the site's first input surface: a contact form handled by a Server Action, plus a Cal.com booking embed. Both forms of untrusted input (form fields and the Turnstile token) are checked in a fixed order: Turnstile, honeypot, a per-IP rate limit, then Zod. The only output is an email to David with escaped content and a validated reply-to. Every failure path returns an error, never a success.

The audit found one Low issue, which was fixed: a predictable salt could have been used for rate-limit hashes. There is also one Low risk, accepted and recorded: the third-party Cal.com script runs on `/contact`.

| Severity      | New | Open after fixes                     |
| ------------- | --- | ------------------------------------ |
| Critical      | 0   | 0                                    |
| High          | 0   | 0                                    |
| Medium        | 0   | 0                                    |
| Low           | 2   | 1 (accepted, see OWASP-A08-002)      |
| Informational | 3   | 3 (accepted, in `docs/decisions.md`) |

The Phase 1 items OWASP-A03-001 and OWASP-A08-001 are unchanged.

## Execution context

| Area                                                                      | Context                                                   |
| ------------------------------------------------------------------------- | --------------------------------------------------------- |
| `app/actions/contact.ts` and everything it imports from `lib/`, `emails/` | Server (Server Action, Node.js runtime on Vercel)         |
| `proxy.ts`, `lib/security/csp.ts`                                         | Server (Next.js proxy, every request except build assets) |
| `components/forms/*`, `components/booking/CalEmbed.tsx`                   | Browser (client components)                               |
| `app/(site)/contact/page.tsx`                                             | Server (rendered per request for the nonce)               |
| Cal.com `embed.js` (loaded from `app.cal.com`), Turnstile `api.js`        | Browser, third-party code on `/contact` only              |
| `playwright.config.ts`, `tests/**`                                        | CI and local only                                         |

## Findings

### A04 Cryptographic Failures

#### OWASP-A04-001: Public development salt could be used for stored rate-limit hashes (fixed)

- **CWE:** [CWE-760](https://cwe.mitre.org/data/definitions/760.html) Use of a One-Way Hash with a Predictable Salt.
- **Severity:** Low. Exploiting it would need a deployment that has Upstash configured but no `RATE_LIMIT_SALT`, plus read access to that Redis database. Then IPv4 addresses could be recovered from the keys by hashing all 2^32 candidates.
- **Confidence:** High for the code path. Production was never exposed: the env schema requires the salt there, and Vercel has a salt for each environment.
- **Location:** `app/actions/contact.ts`, where the salt was chosen. Before the fix: `const salt = env.RATE_LIMIT_SALT ?? DEV_SALT;`.
- **Path:** the visitor's IP, from `x-real-ip`, goes to `hashKey("ip", ip, salt)`. With Upstash configured, the hash becomes a Redis key (`rl:contact:ip:<hash>`). `DEV_SALT` is published in this public repository.
- **Fix applied:** the action now throws, so the form fails closed with a generic error, when `RATE_LIMIT_SALT` is missing and the hash could leave the process: Upstash configured, or any Vercel deployment. The public salt remains only for local runs with the in-memory limiter.
- **References:** [A04:2025](https://owasp.org/Top10/2025/A04_2025-Cryptographic_Failures/), [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html).

### A08 Software or Data Integrity Failures

#### OWASP-A08-002: Cal.com embed script runs on /contact without integrity pinning (accepted)

- **CWE:** [CWE-829](https://cwe.mitre.org/data/definitions/829.html) Inclusion of Functionality from Untrusted Control Sphere.
- **Severity:** Low. `app.cal.com/embed/embed.js` is fetched live and runs in the page with full DOM access, including the contact form fields. A compromise at Cal.com could read what a visitor types on `/contact`. It could not reach other pages, server secrets or the Server Action's checks.
- **Confidence:** High. Verified in `@calcom/embed-react` (it appends `<script src="https://app.cal.com/embed/embed.js">` with no `integrity` attribute) and in the browser.
- **Location:** `components/booking/CalEmbed.tsx`, which imports `@calcom/embed-react`. CSP allowances come from `integrationsForPath("/contact")` in `lib/security/csp.ts`.
- **Why it is accepted:** CLAUDE.md requires the Cal.com inline embed. Cal.com serves embed.js unversioned, so a hash would break on its next deploy. A plain iframe of the booking page was tried and does not render without embed.js. Turnstile's `api.js` is the same pattern; Cloudflare forbids self-hosting or pinning it.
- **Mitigations in place:**
  - Third-party hosts are allowed only on `/contact`. Every other page keeps a strict CSP with no third-party hosts.
  - Scripts still need the per-request nonce or `'strict-dynamic'` trust.
  - Links to `/contact` are full page loads, so its policy never carries over to other pages.
  - The form sends data only to our own Server Action (`form-action 'self'`).
- **Owner:** Claude. Revisit if Cal.com publishes versioned embed builds, or if the booking moves to a link-out button.
- **References:** [A08:2025](https://owasp.org/Top10/2025/A08_2025-Software_or_Data_Integrity_Failures/), [OWASP Third Party JavaScript Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Third_Party_Javascript_Management_Cheat_Sheet.html).

### Informational (accepted, recorded in `docs/decisions.md`)

- **INFO-1: Inline styles allowed on `/contact`.** Cal.com's embed.js injects `<style>` elements without a nonce, so `/contact` uses `style-src 'self' 'unsafe-inline'`. CSS injection would first need an HTML injection point, and React escapes all output on that page. Scripts are unaffected.
- **INFO-2: Turnstile failures are not rate limited.** The pipeline checks Turnstile before the rate limit, as CLAUDE.md specifies. A flood of bad tokens therefore costs one outbound siteverify call each (5 s timeout) but sends no email. Vercel's platform DDoS protection sits in front. If logs show abuse, move the IP limit first.
- **INFO-3: Rate limits on previews are per instance.** Without Upstash, previews use the in-memory limiter, so limits reset when an instance is recycled. Previews are behind Vercel deployment protection. Production requires Upstash through the env schema.

## What was checked

- **A01 Broken Access Control.**
  - No authentication surfaces.
  - The Server Action is protected three ways: Next.js's own origin check with `allowedOrigins: []`, the `proxy.ts` same-origin check (which also rejects POSTs with no `Origin`, re-verified), and `bodySizeLimit: "64kb"`.
  - No redirects. The only server-side fetch is to a constant URL (`SITEVERIFY_URL`), so there is no SSRF.
  - The Cal link comes from an env var validated against `^[a-z0-9-]+/[a-z0-9-]+$`, never from the request.
  - The outbox path is fixed (`.outbox/<timestamp>-<random>`), with no input in the filename.
- **A02 Security Misconfiguration.**
  - Headers are unchanged and cover the new page (Playwright: `/contact` has no CSP violations, both on a direct load and after clicking through from the home page).
  - Per-page CSP: unit tests show the home page has no third-party hosts, and only `/contact` relaxes styles.
  - `EMAIL_TRANSPORT=outbox` is rejected in production by the env schema.
  - Production builds now require the forms and booking variables (`enabledFeatures`).
  - Error responses and the action's catch return fixed messages only.
- **A03 Software Supply Chain.**
  - Five new runtime packages, all pinned exactly and locked, with no install scripts (`allowBuilds` unchanged).
  - The pnpm 1-day minimum release age applies.
  - `pnpm audit --prod --audit-level=high` is clean.
  - `@react-email/components` was not added, because its sub-packages are marked unsupported on npm.
  - Publishers: Resend, Upstash and Cal.com publish their own packages.
- **A04 Cryptographic Failures.**
  - Rate-limit keys are `SHA-256(salt:kind:value)`, never raw IPs or emails. A unit test checks the hashing.
  - Secrets come from validated server env (`server-only`). The Turnstile secret is sent only in the siteverify body.
  - `.env.example` lists names only. Local test values are Cloudflare's published test keys.
  - Finding OWASP-A04-001 fixed.
- **A05 Injection.**
  - The email body is React rendered with `@react-email/render`, so it is escaped. A unit test renders `<script>` and `<img onerror>` payloads as text.
  - Subject and reply-to go through `headerSafe` (control characters removed, length capped). Single-line fields drop CR and LF in Zod. Reply-to is set only after `z.email()`.
  - Resend takes structured fields, not raw headers.
  - Client error text comes from fixed strings.
  - The visitor's own values are echoed back only to that visitor and rendered as React `defaultValue`.
  - No `dangerouslySetInnerHTML` was added.
- **A06 Insecure Design.**
  - Turnstile, honeypot, a 5 per IP per hour limit, and max lengths on every field (name 80, email 254, company 120, message 2000).
  - The topic is an enum.
  - No email goes to a visitor-supplied address, and there is no auto-reply.
  - Honeypot hits return an error rather than a fake success, because CLAUDE.md forbids false success.
  - Playwright checks the sixth submission from one IP is blocked.
- **A07 Authentication Failures.** Not applicable: there is no authentication. MFA on the vendor accounts is tracked in `docs/launch-checklist.md`.
- **A08 Software or Data Integrity.**
  - Form data is parsed only through Zod. No deserialization of untrusted data. There is no Cal.com webhook.
  - Third-party scripts load only on `/contact`, from hosts the CSP allows. See OWASP-A08-002.
- **A09 Logging and Alerting.**
  - New events logged as structured JSON through `logSecurityEvent`, whose allow-list keeps PII out: `turnstile_failed`, `honeypot_hit`, `rate_limited`, `validation_failed` (field names only), `email_send_failed` and `form_error`.
  - Spike alerts: one email per hour to David when `rate_limited` reaches 20, `email_send_failed` reaches 3 or `form_error` reaches 3, counted in Upstash.
  - Limit: if Resend itself is down, the alert email also fails, and only the logs remain.
- **A10 Exceptional Conditions.**
  - Turnstile fails closed on network errors, timeouts, non-200 responses, non-JSON bodies, `success` not true, or (in production) a wrong hostname.
  - The limiter uses `timeout: 0` and rejects on Redis errors.
  - `sendEmail` returns false on any error and never throws. The pipeline and the action both catch, and show a generic error rather than the error page.
  - Unit tests cover each path.

## Coverage

| Category | Status   | Note                                                                             |
| -------- | -------- | -------------------------------------------------------------------------------- |
| A01      | Assessed |                                                                                  |
| A02      | Assessed | Deployed Vercel settings (env values, protection) not visible to a static review |
| A03      | Assessed | Relies on `pnpm audit` data at the time of the run                               |
| A04      | Assessed |                                                                                  |
| A05      | Assessed |                                                                                  |
| A06      | Assessed |                                                                                  |
| A07      | Assessed | No authentication in scope                                                       |
| A08      | Assessed |                                                                                  |
| A09      | Assessed | Log retention and alert delivery depend on Vercel and Resend                     |
| A10      | Assessed |                                                                                  |

## Limitations

- Not run against the real Turnstile, Upstash or Resend accounts, which do not exist yet. Recheck on the first preview deployment with real keys:
  - siteverify with the real secret
  - the Upstash limiter
  - Resend delivery from `send.sureground.tech`
- The Cal.com behavior was verified with Cal.com's public demo event, not David's own event.
- Vercel's handling of `x-real-ip` and `x-forwarded-for` is taken from Vercel's documentation, not observed.

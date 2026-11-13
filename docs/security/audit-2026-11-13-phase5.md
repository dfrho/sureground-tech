# Security audit: Phase 5 (First Step Scorecard)

- **Date:** 2026-11-13
- **Branch:** `p5/scorecard` (against `main` at a1f7462)
- **Standard:** OWASP Top 10:2025, all ten categories (Phase 5 changes `app/actions/`, `lib/forms/` and `lib/security/`)
- **Method:** static review of the source. Runtime evidence is limited to the project's own unit and Playwright tests, which ran locally against the production build with Cloudflare's test keys and the email outbox. No scanners, no network probing.
- **Execution context:** Next.js 16 App Router on Vercel. Server code: `app/actions/scorecard.ts` and `app/actions/contact.ts` (Server Actions), `lib/forms/*`, `lib/scorecard/*`, `emails/*`, `lib/security/*`, `proxy.ts`. Browser code: `components/scorecard/*`, `components/forms/*`, `components/site/NavLink.tsx`. Pure, used by both: `content/scorecard.ts`, `lib/forms/scorecard-schema.ts`.

## Scope

New: `app/actions/scorecard.ts`, `lib/forms/scorecard-schema.ts`, `lib/forms/server-deps.ts`, `lib/scorecard/score.ts`, `lib/scorecard/present.ts`, `content/scorecard.ts`, `emails/ScorecardResult.tsx`, `emails/ScorecardLeadNotify.tsx`, `components/scorecard/*`, `app/(site)/scorecard/page.tsx`, tests.
Changed: `app/actions/contact.ts` (moved its dependency setup to `server-deps.ts`), `lib/forms/pipeline.ts` (per-form messages), `lib/forms/hash.ts` (fix below), `lib/security/csp.ts` (`/scorecard` allows Turnstile), `components/forms/fields.tsx` (CheckboxField), `components/site/NavLink.tsx` and `Footer.tsx` (full page loads to pages with their own CSP), `app/sitemap.ts`.
Re-checked at a high level: `proxy.ts` origin check, `next.config.ts` Server Actions settings, `lib/email/send.ts`, `lib/rate-limit.ts`.

## Summary

The scorecard follows the rules in CLAUDE.md:

- Answers are enums. Each answer must be one of its question's answer ids (Zod).
- The server recomputes the score from those ids (`score()` in the action). A client-sent score is ignored, and a unit test proves it.
- The result email to the visitor's address holds only our fixed text and the score. A unit test posts markup and a spam URL in the first name and company, and checks that neither reaches the visitor's email.
- Turnstile, the honeypot, a per-IP limit and a per-email-hash limit run before any send, through the shared pipeline.
- It fails closed. Both emails must succeed before the visitor sees a success. The lead email goes first, so a failure leaves nothing half-sent.
- Nothing is stored. Answers live in React state only, never in the URL or browser storage.

| Severity      | Count | Status                |
| ------------- | ----- | --------------------- |
| Critical      | 0     |                       |
| High          | 0     |                       |
| Medium        | 0     |                       |
| Low           | 1     | Fixed (OWASP-A06-001) |
| Informational | 2     | Accepted (see below)  |

All findings have High confidence. Every category was assessed for the scope above; the limits are listed at the end.

## Findings

### A06: Insecure Design

#### OWASP-A06-001: Per-email rate limit could be sidestepped with plus-addressing (fixed)

- **CWE:** [CWE-799: Improper Control of Interaction Frequency](https://cwe.mitre.org/data/definitions/799.html)
- **Severity:** Low. Raising the volume of fixed-text result emails to one inbox still needs a fresh Turnstile pass per send and stays under the per-IP limit, so the impact is nuisance mail and sender reputation, not content abuse.
- **Confidence:** High. Traced in code and covered by a unit test after the fix.
- **Location:** `lib/forms/hash.ts`, `hashKey` (before the fix it only trimmed and lowercased emails). The limit is applied in `app/actions/scorecard.ts` (`lateLimits`, bucket `scorecard:email`, 3 per day).
- **Entry point and path:** the `email` field of the scorecard Server Action, then `hashKey("email", …)`, then `allow("scorecard:email", key)`. `pat+1@example.com` and `pat+2@example.com` produced different keys but deliver to the same inbox at most providers. So the "3 per email per day" limit (CLAUDE.md A06) did not hold per inbox.
- **Mitigations already present:** Turnstile per submission, 5 per IP per 10 minutes, and fixed email content (no attacker text reaches the inbox).
- **Fix applied:** `normalizeEmail()` lowercases the address and removes any `+tag` from the local part before hashing, so tagged variants share one limit. Tests: `tests/unit/contact.test.ts` ("rate-limit keys").
- **Residual:** provider-specific aliases, such as dots in Gmail addresses, still count as separate addresses. Accepted: the remaining controls bound the volume and the content is fixed.
- **References:** [OWASP A06:2025](https://owasp.org/Top10/2025/A06_2025-Insecure_Design/), [OWASP Business Logic Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Business_Logic_Security_Cheat_Sheet.html)

#### Informational: result emails go to an address the visitor types

By design (David's decision: email is required for results), the site sends an email to a visitor-supplied address.

Controls in place:

- The content is fixed: band, scores, our observations and the offer, nothing typed by the visitor.
- A required consent checkbox.
- Turnstile and the honeypot.
- Per-IP and per-inbox limits.
- Reply-To is `david@sureground.tech`.

The address is not verified before sending, so a third party could receive one unrequested results email. Accepted; owner David.

#### Informational: the lead notification carries visitor text to David

`ScorecardLeadNotify` renders first name, email, company, size, role and the answers to `CONTACT_TO_EMAIL` only:

- React escapes every value, and a unit test checks that `<b>` arrives as `&lt;b&gt;`.
- The subject includes the company name, which has control characters stripped (Zod `stripControl`, then `headerSafe` in `sendEmail`).

This matches CLAUDE.md ("the lead notification to David may include the submitted fields, rendered as escaped text"). Accepted.

## Coverage by category

| Category                       | Status   | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A01 Broken Access Control      | Assessed | No auth surfaces. The new Server Action is behind the fail-closed same-origin check in `proxy.ts` (`checkSameOrigin`) and Next.js's own action origin check (`allowedOrigins: []`). No redirects, no user-controlled URLs: every link in the results and emails is built from constants (`site.url`, offer slugs from `offers.ts`). No server fetch of user input.                                                                                                            |
| A02 Security Misconfiguration  | Assessed | `/scorecard` gets a per-page CSP that adds only `challenges.cloudflare.com`. Styles keep the nonce, with no `'unsafe-inline'`; that relaxation stays on `/contact` only, for the Cal.com embed. Links to `/scorecard` are full page loads (`NavLink`, `Footer`, `ButtonLink`), so the page always gets its own policy, and a unit test fails if any `<Link>` points at it. Playwright checks the CSP header and finds no violations. Server Action body limit is still 64 KB. |
| A03 Software Supply Chain      | Assessed | No new dependencies. `pnpm audit --prod --audit-level=high`: no known vulnerabilities.                                                                                                                                                                                                                                                                                                                                                                                        |
| A04 Cryptographic Failures     | Assessed | Rate-limit keys are salted SHA-256 of the IP and the normalized email. `server-deps.ts` keeps the Phase 4 rule: the public dev salt is never used when Upstash or `VERCEL_ENV` is present (OWASP-A04-001 from Phase 4). Nothing else is stored.                                                                                                                                                                                                                               |
| A05 Injection                  | Assessed | No `dangerouslySetInnerHTML` outside JSON-LD. Results and both emails render through React (escaped). Email headers: subjects pass through `headerSafe`, and `replyTo` is either the Zod-validated visitor email or a constant. Answer ids are enums, so no visitor text reaches scoring.                                                                                                                                                                                     |
| A06 Insecure Design            | Assessed | One Low, fixed (above). Server-side scoring and enum answers verified. The abuse rule is verified by a unit test.                                                                                                                                                                                                                                                                                                                                                             |
| A07 Authentication Failures    | Assessed | No site authentication. Account MFA is tracked in `docs/launch-checklist.md`.                                                                                                                                                                                                                                                                                                                                                                                                 |
| A08 Software or Data Integrity | Assessed | Form data is read as strings and validated by Zod. No deserialization. The visitor's results come from the server's computation and are returned in the action response, never reconstructed from client data.                                                                                                                                                                                                                                                                |
| A09 Logging and Alerting       | Assessed | Scorecard events use the PII-free logger with `form: "scorecard"`: Turnstile failures, honeypot hits, rate-limit blocks, validation failures (field names only), send failures and form errors. Send failures and form errors count toward the hourly alert.                                                                                                                                                                                                                  |
| A10 Exceptional Conditions     | Assessed | The action wraps everything in try/catch and returns a generic error with the visitor's own values. An unexpected success without an outcome throws, and the catch turns it into an error. `sendEmail` never throws and returns false on failure. A success is shown only when both sends succeed.                                                                                                                                                                            |

## Limitations

- Static review. Deployed headers, Vercel firewall settings and Upstash behavior under load were not observed in production.
- Delivery behavior (Resend, recipients' providers) and Turnstile production hostname checks rely on Phase 4's configuration and were not exercised live.
- Provider-specific email aliases beyond `+tags` are not normalized (see OWASP-A06-001, residual).

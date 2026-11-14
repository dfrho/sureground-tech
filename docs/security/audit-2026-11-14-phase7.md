# Security audit: Phase 7 (Guided Demo Site Build)

- **Date:** 2026-11-14
- **Branch:** `p7/demo-site-build`, compared with `main` at e3547b7 (Phase 6 merged)
- **Standard:** OWASP Top 10:2025. All ten categories were checked, because Phase 7 changes the contact flow and `lib/forms/` (CLAUDE.md audit gate).
- **Method:** static review of the Phase 7 diff, plus the code paths it touches. The project's own checks also ran (`pnpm audit:deps`, unit and e2e tests), as the CLAUDE.md phase gate requires. No scanners were run, and the deployed site was not probed.
- **Execution context:**
  - Server:
    - `app/(site)/contact/page.tsx`, a Server Component that reads `searchParams`
    - `app/(site)/services/[slug]/page.tsx` and `app/(site)/pricing/page.tsx`, Server Components that render from repo config
    - `lib/forms/contact-schema.ts`, shared by the server action and the form
  - Browser: `components/forms/ContactForm.tsx` (`"use client"`), which receives the preset topic as a prop.
  - Build: `lib/config/offers.ts`, `content/services/*.ts` and `content/facts.ts`. These are repo constants, validated with Zod when the modules load.

## Summary

Phase 7 adds one offer, an add-ons field and a per-service closing call to action. It also adds one new input: the `?topic=` query value on `/contact`. Here is the path that value takes, from source to sink:

1. **Source.** `searchParams.topic` in `app/(site)/contact/page.tsx`. Next.js passes it as a string, a string array or `undefined`, and the attacker controls it.
2. **Check.** `topicFromQuery` (`lib/forms/contact-schema.ts`) returns a value only when the input is a string and an own property of a fixed one-entry map (`"demo-build"`).
   - Arrays, other values and prototype keys (`__proto__`, `constructor`, `toString`) return `undefined`.
   - Unit tests in `tests/unit/contact.test.ts` cover each of these cases.
3. **Sink.** The result reaches `ContactForm` as `defaultTopic`, and from there the select's `defaultValue`. The select can only take one of the fixed enum options. The raw query value is never rendered, logged, put in a URL or redirected.
4. **Submit.** On submit, the server action still parses `topic` with `z.enum(contactTopics)`, so the preset grants nothing: the visitor could pick "Demo build" by hand anyway.
5. **Email.** "Demo build" flows into the `ContactNotify` subject and body like every other topic. It is a fixed string from the enum, and the subject still passes through `headerSafe`.

The new CTA links come from repo content (`content/services/demo-site-build.ts`). Their schema accepts only site paths (`/^\/[^/]/`), which rules out absolute and protocol-relative URLs. Links to `/contact` keep the full page load that the per-page CSP needs (`needsFullPageLoad` strips the query and hash).

The e2e CSP sweep now includes `/services/demo-site-build` and `/contact?topic=demo-build`.

No Critical, High, Medium, Low or Informational findings.

| Severity      | Count |
| ------------- | ----- |
| Critical      | 0     |
| High          | 0     |
| Medium        | 0     |
| Low           | 0     |
| Informational | 0     |

## Coverage by category

| Category                       | Status   | Notes                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A01 Broken Access Control      | Assessed | Still no auth surfaces. `services/[slug]` keeps `dynamicParams = false`; the new slug comes from `generateStaticParams` over repo content. The `?topic=` value is never used in a redirect, link or fetch. CTA hrefs are repo constants limited to site paths. Server Action origin checks (`proxy.ts`, `allowedOrigins`) are unchanged. |
| A02 Security Misconfiguration  | Assessed | No change to `proxy.ts`, `next.config.ts`, `lib/security/` or headers. `/contact` keeps its own CSP, because the integration lookup uses the pathname without the query. The canonical URL of `/contact` stays `/contact`, so preset links are not indexed as separate pages.                                                            |
| A03 Software Supply Chain      | Assessed | No new dependencies, and the lockfile is unchanged. `pnpm audit:deps` result is recorded in the Phase 7 status.                                                                                                                                                                                                                          |
| A04 Cryptographic Failures     | Assessed | No change to hashing, salts, secrets or env handling. No new environment variables.                                                                                                                                                                                                                                                      |
| A05 Injection                  | Assessed | The query value is never rendered, because only an enum literal reaches the DOM, and React escapes all text. No new `dangerouslySetInnerHTML`. Offer and service text comes from repo files and is escaped by React. Email subjects still go through `headerSafe`, and "Demo build" has no control characters.                           |
| A06 Insecure Design            | Assessed | The preset is a convenience only; the server action re-validates the topic as an enum. Turnstile, honeypot, rate limits and field limits on the contact form are unchanged. The new offer's prices, terms and add-ons live only in `offers.ts`, `check:offers` passes, and `lint:copy` finds no prices elsewhere.                        |
| A07 Authentication Failures    | Assessed | No site authentication. Operator MFA is still tracked in `docs/launch-checklist.md`.                                                                                                                                                                                                                                                     |
| A08 Software or Data Integrity | Assessed | No new deserialization, webhooks or third-party scripts. The new `addOns` and `cta` fields are strict Zod objects validated at module load, and invalid content fails the build.                                                                                                                                                         |
| A09 Logging and Alerting       | Assessed | No logging changes. The query value is not logged. Contact-form security events (validation failures by field name, rate-limit blocks) are unchanged.                                                                                                                                                                                    |
| A10 Exceptional Conditions     | Assessed | `topicFromQuery` cannot throw; it returns `undefined` for every unexpected shape. The error pages and the fail-closed pipeline are unchanged.                                                                                                                                                                                            |

## Limitations

- This was a static review of the diff and its callers. The rest of the codebase was last reviewed in full in `docs/security/audit-2026-11-13-launch.md`, and Phase 7 does not touch it.
- The deployed headers and CSP on the new page are confirmed by the e2e CSP sweep against a local production build, not on sureground.tech. Recheck after the merge.

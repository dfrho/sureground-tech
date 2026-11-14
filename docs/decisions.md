# Decisions

Version-specific choices, new dependencies and accepted risks. Newest first within each section.

## Versions (Phase 0, 2026-11-09)

| Tool         | Version                             | Note                                                                                                                                      |
| ------------ | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Node         | 24 (`.nvmrc`), `engines` `>=24 <25` |                                                                                                                                           |
| pnpm         | 12.16.1 (`packageManager`)          | Install-script allow list lives in `pnpm-workspace.yaml` as `allowBuilds` (pnpm 10+ replaced `onlyBuiltDependencies`). `saveExact: true`. |
| Next.js      | 16.4.5                              | Scaffolded with `create-next-app@16.4.5`                                                                                                  |
| React        | 19.3.0                              |                                                                                                                                           |
| TypeScript   | 5.9.3, `strict`                     |                                                                                                                                           |
| Tailwind CSS | 4.3.5 via `@tailwindcss/turbopack`  | Scaffold default for Next 16.4; no PostCSS config.                                                                                        |
| Zod          | 4.6.7                               | Uses Zod 4 top-level `z.email()` and `z.url()`.                                                                                           |
| Vitest       | 5.1.0                               | Config is `vitest.config.mts` (ESM) to avoid Vite's CJS loader warning.                                                                   |
| Playwright   | `@playwright/test`, Chromium only   |                                                                                                                                           |

## CSP strategy: per-request nonces (Phase 0)

**Choice:** `proxy.ts` generates a 128-bit nonce per request and sends `script-src 'self' 'nonce-…' 'strict-dynamic'`. Next.js reads the nonce from the request CSP header and applies it to its own scripts. The root layout calls `await connection()` so every page renders per request.

**Why not SRI:** Next.js 16 offers `experimental.sri`, which hashes external script files and keeps static rendering. But every App Router page also emits inline scripts for the RSC payload (measured: 3 of 9 script tags on the placeholder home page are inline). SRI does not cover inline scripts, so a no-nonce policy would need `script-src 'unsafe-inline'`, which defeats the CSP for XSS. The feature is also still experimental.

**Cost:** no static generation, ISR or Partial Prerendering. `cacheComponents` and `partialPrefetching` (on in the 16.4 scaffold) are turned off because the Next.js docs state PPR is incompatible with nonce CSP. Each page view is a server render on a Vercel Function, which adds TTFB (typically tens to low hundreds of milliseconds) and function invocations. For a small marketing site this fits the LCP budget of 2.5s; Phase 6 Lighthouse runs will confirm. Revisit if Next.js ships stable hash-based CSP for inline scripts.

**Styles:** production `style-src 'self' 'nonce-…'`. `style-src-attr 'unsafe-inline'` is allowed because React `style` props render as attributes, which nonces cannot cover; attribute styles cannot run script. Development adds `'unsafe-eval'` (React debugging) and `'unsafe-inline'` styles, and drops `upgrade-insecure-requests` for http localhost.

**Third parties:** `lib/security/csp.ts` holds the Turnstile and Cal.com host lists but enables none yet. Phase 4 turns them on for the pages that need them. Vercel Analytics is same-origin in production.

## Security headers (Phase 0)

- `lib/security/headers.ts` is the single list. `next.config.ts` `headers()` applies it to every route, including `_next/static` assets that the proxy matcher skips, and `proxy.ts` sets it again with the CSP on pages.
- HSTS is `max-age=63072000; includeSubDomains` without `preload` until David confirms every subdomain serves HTTPS.

## Indexing: only sureground.tech (2026-11-10)

- Vercel Standard protection leaves the production `vercel.app` domain public, so production is reachable at `sureground-tech.vercel.app` before the custom domain is attached. "All deployments" protection is a paid add-on, so instead every host except `sureground.tech` and `www.sureground.tech` gets `X-Robots-Tag: noindex, nofollow` (`noindexRule()` in `lib/security/headers.ts`, applied in `next.config.ts`).
- It is an allowlist, so it fails toward noindex: deployment URLs, localhost and any future alias are covered without changes. It stays after launch, so the vercel.app address never competes with the real domain in search results.
- Full audit: `docs/security/audit-2026-11-10.md` (no new findings).

## Server Actions origin check (Phase 0)

- Next.js 16 `experimental.serverActions.allowedOrigins` lists _extra_ hosts. Left empty, only the deployment's own host is accepted, which covers production and each preview URL. Body limit is `64kb`.
- Next.js lets a Server Action through with only a warning when the request has no `Origin` header. `proxy.ts` closes that gap: any non-GET/HEAD/OPTIONS request without an `Origin` whose host equals `x-forwarded-host` (Vercel sets it) or `host` gets a 403 and an `origin_rejected` security log line. If a webhook route is ever added (for example Cal.com), it needs an explicit exemption plus signature verification.

## Environment validation (Phase 0)

- `lib/env.schema.ts` holds the Zod schemas without `server-only`, so build scripts and tests can import it. `lib/env.ts` (server, imports `server-only`) and `lib/env.public.ts` (browser) wrap it.
- `pnpm build` runs `scripts/check-env.ts` first. On Vercel production (`VERCEL_ENV=production`) every variable for the enabled features must be set and `EMAIL_TRANSPORT` must be `resend`. Elsewhere it validates only what is set, so local and preview builds work before accounts exist.
- **Required variables grow with features (2026-11-10, David's call).** `lib/env.schema.ts` groups variables by feature (`core`, `email`, `forms`, `booking`) and `enabledFeatures` lists what the site ships (now `core` and `email`). Production requires only those groups, so it can build before the Turnstile, Upstash and Cal.com accounts exist. The phase that ships a feature adds its group: Phase 4 adds `forms` and `booking`. A unit test fails if any shipped code mentions a variable from a group that is not enabled, so a feature cannot reach production without its settings being required. `RATE_LIMIT_SALT` sits in `forms` with Upstash, since only rate limiting uses it.
- The production schema marks the required variables non-optional, so one run reports every missing variable. Before this change a validation error in one field stopped the check early and hid the rest.
- `pnpm build` also runs `check:offers --production-only`, which fails Vercel production builds while any offer is unconfirmed and only warns elsewhere. Plain `pnpm check:offers` always fails on unconfirmed offers.

## Copy lint (Phase 0)

- `pnpm lint:copy` scans `app/`, `components/`, `content/`, `emails/`, `lib/`, `public/`, `proxy.ts` and `next.config.ts`. It skips `lib/copy/banned-words.ts` (which must name the words) and allows dollar amounts only in `lib/config/offers.ts`. Tests, scripts and docs do not ship and are not scanned.
- Banned list adds close variants of the CLAUDE.md list: "revolutionize", "pioneering", "trailblazing", "groundbreaking", "game-changer", "magical", "left behind". "Pioneer" itself stays allowed for the positioning line.
- `CLAUDE.md` and `docs/brand-guide.md` are excluded from Prettier. The first `pnpm format` run in Phase 0 re-padded their Markdown tables (whitespace only) before the exclusion was added.

## Offers shape (Phase 0)

- Every offer in `lib/config/offers.ts` counts as published.
- Optional `tiers` field (name, duration, startingAt) for offers with more than one price. AI Enablement uses it: half-day workshop and 4-week team program. The schema requires `startingAt` to equal the lowest tier, so "starting at" copy stays correct. Added at David's request on 2026-11-09.

## Supply chain delays (Phase 0 audit)

- Dependabot waits 7 days (`cooldown`) before proposing a new npm or Actions release.
- pnpm `minimumReleaseAge` is 1 day (1440 minutes). Seven days rejected the current lockfile because Next.js 16.4.5 was 6 days old when scaffolded. Raise it to 7 days once the lockfile has aged (owner: Claude, next dependency update).
- The proxy matcher has no `missing` clause for prefetch headers, so a POST cannot skip the origin check by sending one (audit OWASP-A01-001).

## Vercel project (2026-11-09)

- Project `sureground-tech` in team "David Rhodes' projects" (`david-rhodes-projects`), linked to `dfrho/sureground-tech`, production branch `main`.
- Node.js set to 24.x (it defaulted to 26.x). `vercel.json` pins `pnpm install --frozen-lockfile` and `pnpm build`, so `check-env` and `check:offers --production-only` run before `next build`.
- Deployment protection is Vercel's Standard setting (`all_except_custom_domains`).
- Vercel CLI 65.12.1 is required for `vercel login` (device flow); 29.x login methods were removed by Vercel in February 2026.

## Design system and shell (Phase 1, 2026-11-09)

- **Tokens:** `lib/design/tokens.ts` stays the source of truth. `app/globals.css` repeats the values as CSS variables for `.light`, `.dark` and a `prefers-color-scheme: dark` fallback for visitors without JavaScript; `tests/unit/tokens-css.test.ts` fails if they drift. Two non-text tokens were added for the logo (`logo-tile`, `logo-steps`): primary mark in dark mode, reversed mark in light mode, per the brand guide.
- **Tailwind:** `@theme inline` maps the tokens to utilities (`bg-bg`, `text-muted`, `text-accent-text` and so on) and removes the default Tailwind palette (`--color-*: initial`), so only brand colors can be used. The brand type scale is available as `text-display`, `text-h1`, `text-h2`, `text-h3`, `text-body`, `text-small` and `text-label`. Prettier's Tailwind plugin reads `app/globals.css` (`tailwindStylesheet`) so it sorts the custom classes correctly.
- **Theme:** `next-themes` 0.4.6 (on the CLAUDE.md stack) with `attribute="class"`, `defaultTheme="system"`. Its no-flash inline script gets the per-request CSP nonce from the root layout, which reads `x-nonce` with `headers()`. That read also keeps every page rendering per request, so the `connection()` call was dropped.
- **Theme toggle:** three native radio buttons in a fieldset, so arrow keys and screen readers work without extra code. Until mount it renders the same controls disabled with none selected (no layout shift, no hydration mismatch).
- **Mobile nav:** a native modal `<dialog>` (focus trap, Escape, inert page, focus returned to the menu button) instead of a dialog library. shadcn/ui is deferred until a component actually needs it.
- **Breakpoint:** inline navigation from 1024px (`lg`); below that the menu button. At 768px five links, the toggle and the Book a call button do not fit beside the wordmark.
- **Fonts:** Space Grotesk (500, 700), IBM Plex Sans (400, 600) and IBM Plex Mono (400, 500) are committed as latin-subset `woff2` files in `app/fonts/` and loaded with `next/font/local`, so `font-src 'self'` is enough, visitors never contact Google and builds need no font download. The files come from the Fontsource npm packages 5.3.0 (SIL Open Font License, copies in `app/fonts/LICENSE-*.txt`). Until Phase 6 this was `next/font/google` (see OWASP-A08-001).
- **Favicon:** the scaffold `favicon.ico` was replaced by `app/icon.svg` (primary mark).
- **Error pages:** `error.tsx` and `global-error.tsx` show fixed text and never the error message or digest. `global-error.tsx` follows the operating-system theme only, since next-themes is not loaded there.
- **E2E screenshots:** `tests/e2e/shell.spec.ts` saves a full-page screenshot of every page in every project (360, 768, 1280 by light and dark) to `test-results/`; CI uploads them as the `playwright-screenshots` artifact for 14 days. They are review artifacts, not pixel-diff baselines: baselines differ between macOS and the Linux CI runner.
- **Known until Phase 2:** header and footer links point to pages that do not exist yet. Their background prefetches return 404 RSC responses whose bodies never finish, so tests must not wait for `networkidle`.

## Hourly work (2026-11-09)

- David bills hourly for work outside the packaged offers. The packaged offers keep their fixed, confirmed prices in `lib/config/offers.ts`.
- The rate is deliberately not in `offers.ts` or anywhere else in this public repo, and is never shown on the site. That keeps the "every displayed price lives in `offers.ts`" rule intact: nothing hourly is displayed.
- Copy says the packaged offers have fixed fees paid in milestones; it never says "never by the hour".

## Marketing pages (Phase 2, 2026-11-10)

- **TSX, not MDX, for About and the legal pages.** The MDX pipeline (`@next/mdx`, a `next.config.ts` change) arrives with the blog in Phase 3. About and legal are TSX pages for now with `{/* COPY: draft */}` markers; they can move to `content/pages/*.mdx` once MDX exists.
- **Service content is words only.** `content/services/<slug>.ts` holds headline, intro, audience, problem, steps and FAQ, validated with Zod at module load against `offers.ts` and `facts.ts`. Prices, durations and terms render from `offers.ts`; a unit test fails if a service file contains a dollar amount or a duration.
- **Prices are formatted, never written.** `lib/offers/format.ts` turns `startingAt` into labels with `Intl.NumberFormat`, so no component contains a price.
- **JSON-LD** goes through `components/seo/JsonLd.tsx` (nonce attached) and `lib/seo/jsonld.ts` (escapes `<`, U+2028, U+2029). `ProfessionalService` on the home page, `Person` on About, `Service` and `BreadcrumbList` on each service page.
- **Contrast:** Signal Blue on Graphite is 4.4:1, so links inside dark cards use the text color with an underline; Signal Blue text stays on the page background or at large sizes.
- **Role dates come from LinkedIn.** David asked (2026-11-11) for the months on his LinkedIn profile. LinkedIn shows Feedonomics as current, so its end month is October 2026, when David left, and a unit test requires every role to have an end month in the past. BloomForge, his own consultancy from July 2024 to May 2025, is named at his request; the home proof strip still lists only the four former employers.
- **Catalog and Feed Readiness removed** (David, 2026-11-11): too soon after leaving Feedonomics. The offer, its service page and its content file are gone; the home page shows two specialty offers. Do not reintroduce it unless David asks.
- **Home latest posts** are left out until Phase 3 adds the blog.
- **Sitemap and robots** list only static public pages; later phases add scorecard, contact and blog. (Blog added in Phase 3, contact in Phase 4.)

## Blog (Phase 3, 2026-11-13)

- **`@next/mdx` with no plugins.** `next.config.ts` is wrapped with `createMDX({})`; the wrapper spreads the existing config, so headers and Server Actions settings are unchanged. No remark or rehype plugins (Turbopack needs serializable plugin options, and none are needed yet). `mdx-components.tsx` at the root supplies `a` (external links get `rel="noopener noreferrer"`), `Callout`, `Figure`, `Stat` and `OfferLink`. The four MDX packages are the ones the Next.js MDX guide lists, pinned exactly.
- **Metadata lives in `content/blog/posts.ts`, not as an MDX export.** CLAUDE.md first described each MDX file exporting `metadata`. Keeping it in one TypeScript registry lets unit tests, the sitemap and RSS read and validate it without compiling MDX, and gives `generateStaticParams` a closed list. Each body is `content/blog/<slug>.mdx`; a unit test fails if a file and a registry entry do not match.
- **Reading time is stored, then checked.** `readingMinutes` is in the metadata (230 words a minute, rounded up) and a unit test recomputes it from the MDX file. This avoids reading files at request time, which Vercel's per-request rendering (nonce CSP) would need to trace.
- **Drafts:** shown in local development and on Vercel preview deployments (behind deployment protection) so David can review them on his phone; never in production builds, the sitemap or RSS. Draft pages also set `robots: noindex`.
- **Open Graph images** come from `app/(site)/blog/[slug]/opengraph-image.tsx` (`next/og`, default font). Next.js adds a hash to the image URL, so the BlogPosting JSON-LD leaves `image` out rather than hard-code a path. Unknown slugs are a 404 (audit OWASP-A06-001).
- **Citations in posts** are links on the source name in the text plus a Sources list at the end, since post facts come from articles rather than `content/sources.ts` statistics. Statistics in posts still use `<Stat id=… />`.

## Contact and booking (Phase 4, 2026-11-13)

- **One shared form pipeline** in `lib/forms/pipeline.ts`, in the order CLAUDE.md gives: Turnstile, honeypot, rate limit, Zod, then the send step. Every dependency is injected, so the order and the fail-closed paths are unit tested without network calls. The Scorecard (Phase 5) reuses it with an extra email-hash limit (`lateLimits`).
- **Fails closed everywhere.** Turnstile errors, timeouts (5 s) and non-success answers reject. The Upstash limiter runs with `timeout: 0` (the library otherwise lets requests through when Redis is slow) and a Redis error rejects. A failed or thrown send never shows success. Configuration errors in the action return a generic form error instead of the error page.
- **Honeypot hits get an error, not a fake success.** CLAUDE.md says never show a false success; people never see the field, so only bots get the error.
- **Turnstile hostname check in production.** Siteverify must report `sureground.tech` or `www.sureground.tech`. Previews and local runs skip the check (Cloudflare's test keys report `example.com`).
- **Rate limits:** 5 contact messages per IP per hour, sliding window, keyed by `SHA-256(RATE_LIMIT_SALT:ip:value)`. The client IP comes from `x-real-ip` / `x-forwarded-for`, which Vercel sets. Without Upstash (local and tests only; production requires it) a per-process memory limiter is used.
- **Spike alert (A09):** `rate_limited` (20 an hour), `email_send_failed` (3) and `form_error` (3) are counted per hour in Upstash; when a count reaches its threshold, David gets one fixed-text alert email for that hour.
- **Email:** `lib/email/send.ts` is the only Resend caller. Templates are React components rendered with `@react-email/render`, in plain table markup. `@react-email/components` 1.x depends on sub-packages npm marks as no longer supported, so it was not added. Subjects and reply-to pass through `headerSafe` (control characters stripped, length capped); reply-to is set only after Zod email validation. `EMAIL_TRANSPORT=outbox` writes `.outbox/*.html` and `.json` locally and in e2e tests.
- **Cal.com embed uses `@calcom/embed-react`.** A plain iframe of the booking page does not work: the page waits for embed.js when framed. embed.js injects `<style>` elements into shadow roots without a nonce, and a nonce in `style-src` disables `'unsafe-inline'`.
- **So the CSP is per page.** `/contact` gets `style-src 'self' 'unsafe-inline'` plus the Turnstile and Cal.com hosts; every other page keeps the strict nonce policy with no third-party hosts. Scripts stay nonce plus `'strict-dynamic'` on every page. Client-side navigation keeps the first document's CSP, so every link to `/contact` is a full page load (`needsFullPageLoad` in `lib/security/csp.ts`, used by `ButtonLink`, `MobileNav` and `Footer`). A unit test fails if a `next/link` points at `/contact`, and an e2e test clicks through from the home page.
- **The Cal.com iframe follows the theme** by remounting with the resolved theme; it renders only after mount to avoid a hydration mismatch.
- **Form errors use brand tokens,** not a new red: a 2px text-color border on the field and an "Error:" label in mono. Ask David if he wants an error color added to the palette.
- **Upstash variable names:** the Vercel Marketplace connected Upstash as `KV_REST_API_URL` and `KV_REST_API_TOKEN`. `withEnvAliases` in `lib/env.schema.ts` maps them to the `UPSTASH_*` names before validation (server env and `check-env`).
- **Feature gate:** `enabledFeatures` now includes `forms` and `booking`, so a production build fails until the Turnstile keys, Upstash variables, `RATE_LIMIT_SALT` and `NEXT_PUBLIC_CAL_LINK` are set in Vercel Production. Previews do not require them.
- **E2E tests** use Cloudflare's public always-pass Turnstile test keys, the outbox transport and Cal.com's public demo booking page (`rick/get-rick-rolled`), set in `playwright.config.ts`. Each submission test sends its own `x-real-ip`, which also tests the per-IP limit.

## First Step Scorecard (Phase 5, 2026-11-13)

- **Content and scoring are separate.** `content/scorecard.ts` holds the questions, answer points, bands, observations and recommendations (all drafts until David approves). `lib/scorecard/score.ts` is a pure function over answer ids; `lib/scorecard/present.ts` turns a score into display data with the price from `offers.ts`.
- **Answers are ids, not points.** Each question's answers are posted as ids `a` to `e` and validated as an enum per question; the server looks up the points. A client-sent score field is ignored (unit tested).
- **Recommendation rule:** the weakest dimension picks the offer (Safety to AI Safe Start; Goals, Workflows, Data and Tools to AI Opportunity Assessment; People to AI Enablement). Ties go to the first in this order: Safety, Goals, People, Workflows, Data, Tools (risk first, then the cheapest start). When every dimension scores at least 6 of 8, there is no weak spot and the recommendation is the Pilot Sprint. David approved the mapping on 2026-11-13, moving Data and Tools from AI Engineering to the Assessment: a $10,000 build is too big a first ask for someone unsure of their data, and the Assessment's fee is credited toward a Pilot Sprint. Tie order and wording are still drafts.
- **In-house team (David, 2026-11-13):** the email gate asks "Who would build and run an AI project for you today?" (five fixed options, approved by David). It is not scored, because engineers do not make the ground more solid, but it changes the offer: a team that can build gets its own first step in place of a build offer (in practice the Pilot Sprint, since no area maps to AI Engineering any more). An engineering team with little AI experience gets the Fractional AI Solutions Engineer; one that already builds with AI gets AI Pilot Triage. Other recommendations stand. The answer appears in the lead email, so David sees what the visitor saw. Rules in `teamOverrides` in `content/scorecard.ts`.
- **Observations:** up to two weak areas (below 6 of 8) and the strongest area if it scores 6 or more, so every result has one to three.
- **Both emails must succeed.** The lead email to David goes first, then the results to the visitor; the visitor sees success only when both sent. If the lead fails nothing reaches the visitor and a retry is clean; if the results email fails, a retry can send David a duplicate lead, which is harmless.
- **Abuse rule:** `ScorecardResult` takes only the computed outcome, never the submitted fields, so nothing the visitor typed can reach the address they typed. Reply-To on it is `david@sureground.tech`.
- **Rate limits:** 5 per IP per 10 minutes before validation, then 3 per email per day after validation (`lateLimits`). Email keys drop `+tags` so one inbox has one limit (audit OWASP-A06-001).
- **Per-page CSP:** `/scorecard` allows Turnstile only, and keeps the nonce on styles. `NavLink` and `Footer` now render a plain `<a>` for any page with its own CSP, so the header and footer links to `/scorecard` are full page loads.
- **One question per screen at every width,** not only on mobile: simpler, and the flow is short. Focus moves to each new question, the email gate and the result heading.
- **Shared server setup:** `lib/forms/server-deps.ts` builds the Turnstile, limiter and logging dependencies and the salted key helper for both actions. The pipeline takes per-form error wording.

## Phase 6: launch hardening (2026-11-13)

- **Zod runs jitless (`lib/zod.ts`).** Zod 4 probes `new Function` once to decide whether to compile faster parsers. The probe is caught, but under the site's CSP (no `'unsafe-eval'`) Chrome reports it as a violation, which Lighthouse counted against Best Practices on `/scorecard`. `z.config({ jitless: true })` skips the probe and parses the same way. Every module imports `z` from `@/lib/zod`; ESLint blocks direct `zod` imports. The e2e CSP checks now also listen for `securitypolicyviolation` events, which catch violations that never reach the console.
- **Lighthouse runs locally** against the production build (`pnpm build && pnpm start`, Lighthouse 13.6.0, mobile defaults). Off sureground.tech the site sends `X-Robots-Tag: noindex` on purpose, so the SEO audit `is-crawlable` fails everywhere except the real domain. The SEO score is confirmed again on sureground.tech after the DNS cutover.

## Phase 7: Guided Demo Site Build (2026-11-14)

- **Add-ons on the offer shape.** `offerSchema` gained an optional `addOns` array (`name`, `startingAt`, `cadence`), as CLAUDE.md asks. The two packages (Demo Pilot and Demo Site Build) use the existing `tiers` field, so `startingAt` stays the pilot price. Upkeep is listed once, as a monthly add-on, not repeated in `terms`. One component, `components/offers/PriceDetails.tsx`, renders tiers and add-ons on both the service page and the Pricing page.
- **Left out on purpose.** The research doc's Demo Program ($30,000), the five-version bundle and the platform pack are not in CLAUDE.md's approved list, so they are not on the site. David approved the Gartner and Forrester conference demos on 2026-11-14; they are now in the `se-roles` proof point.
- **Per-service closing CTA.** `ServiceContent` has an optional `cta` (title, body, one or two site-path links). When set, the service page shows it instead of the scorecard and Fit Call buttons, including on the `?from=scorecard` arrival. Only `demo-site-build` uses it.
- **Contact topic preset.** `/contact?topic=demo-build` preselects "Demo build". `topicFromQuery` maps exact, known slugs to the topic enum through an own-property lookup and ignores everything else (arrays, other values, prototype names); the value is never rendered or redirected. The contact page already renders per request for its nonce CSP, so reading `searchParams` costs nothing.
- **Home page.** The home Specialty block was already an explicit slug list, so the new offer stays off it until David approves adding it after the first pilot.

- **"Live" for the Demo Site Build (approved 2026-11-14).** The guarantee's "live" means: deployed on the client's domain or a SureGround subdomain, tracking verified end to end, and at least one share link sent to a real prospect. This goes in each SOW, not on the site.

## Name change to SureGround Tech (2026-11-14)

- David renamed the company from SureGround to **SureGround Tech**. The domain (sureground.tech), email addresses, tagline ("AI on sure ground.") and logo icon are unchanged.
- Wordmark: **Sure**Ground Tech, with "Tech" at full size and weight in the text color (option B of three mockups David reviewed).
- The full name goes in formal spots: `site.name` (page titles, copyright, logo link labels, JSON-LD, RSS, email footers, legal pages), the boilerplate, the home page title, the founder photo captions and the first mention on About, the Privacy and Terms descriptions, and the blog Open Graph wordmark. Running copy keeps the short name, for example "Why SureGround" and the home subhead.
- The email sender name comes from the `EMAIL_FROM` variable in Vercel, which David updates (tracked in `docs/launch-checklist.md`).

## Dependencies added outside the CLAUDE.md stack

| Package                             | Reason                                                               |
| ----------------------------------- | -------------------------------------------------------------------- |
| `server-only`                       | Makes a client bundle fail at build time if it imports `lib/env.ts`. |
| `tsx` (dev)                         | Runs the TypeScript check scripts in `scripts/`.                     |
| `prettier-plugin-tailwindcss` (dev) | Stable class order so diffs stay small.                              |
| `@react-email/render`               | Renders the React email templates to HTML (peer of `resend`).        |
| `@upstash/redis`                    | Redis client that `@upstash/ratelimit` needs.                        |

## Accepted risks and open findings

See `docs/security/audit-2026-11-09.md` for the Phase 0 audit, `docs/security/audit-2026-11-09-phase1.md` for Phase 1 `docs/security/audit-2026-11-10-phase2.md` for Phase 2 (no findings), `docs/security/audit-2026-11-13-phase3.md` for Phase 3 `docs/security/audit-2026-11-13-phase4.md` for Phase 4 `docs/security/audit-2026-11-13-phase5.md` for Phase 5 `docs/security/audit-2026-11-13-launch.md` for the pre-launch full audit (no Critical, High, Medium or Low) and `docs/security/audit-2026-11-14-phase7.md` for Phase 7 (no findings). Medium and Low items not fixed are listed there with an owner.

- **OWASP-A03-001 (Phase 1, Informational):** `next-themes` 0.4.6 releases rarely. Kept: it is on the locked stack, has no dependencies or install scripts, and its inline script takes only static props. Revisit if 1.0 ships or an advisory appears. Owner: Claude.
- **OWASP-A08-001 (Phase 1, Informational): fixed in Phase 6.** Fonts are now committed `woff2` files loaded with `next/font/local`; nothing is downloaded at build time.
- **OWASP-A08-002 (Phase 4, Low):** Cal.com's `embed.js` is loaded live from `app.cal.com` without an integrity hash and runs on `/contact`. Accepted: the inline embed is required, Cal.com does not publish versioned builds, and a plain iframe does not work. Limited to `/contact` by the per-page CSP. Revisit if Cal.com ships versioned embeds, or switch to a link-out button. Owner: Claude.
- **Phase 4 Informational:** inline styles on `/contact` (Cal.com needs them), Turnstile checked before the rate limit (as CLAUDE.md orders it), and per-instance rate limits on previews without Upstash. Details in the Phase 4 audit. Owner: Claude.
- **Phase 5 Informational:** results go to an unverified, visitor-typed address (fixed content, consent box, Turnstile and limits; David's decision that email is required), and provider aliases such as Gmail dots are not normalized for the per-email limit. Details in the Phase 5 audit. Owner: Claude.
- **Pre-launch Informational (Phase 6):** DMARC is `p=none` (tighten after a few weeks of normal sending) and HSTS `includeSubDomains` needs every future subdomain on HTTPS. Both are in `docs/launch-checklist.md`. Owner: David.

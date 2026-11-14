# SureGround website (sureground.tech)

You are building and maintaining sureground.tech for David Rhodes. Read this file at the start of every session. Supporting material lives in `docs/`: read `docs/brand-guide.md` before any UI work and `docs/research/offerings-report.md` before writing service or pricing copy.

## What this is

SureGround is a one-person AI engineering and enablement firm in Nashville, TN. It helps owners and CEOs of small and mid-size businesses (roughly 10 to 250 employees, with no in-house team that builds with AI) put AI to work without becoming the experiment. (Target refined by David, 2026-11-13: an in-house engineering team predicts fit better than headcount. This wording is internal; public copy changes only when he approves it.)

Positioning line: **"You don't have to be the pioneer."**
Tagline: **"AI on sure ground."**
Second story, for technical buyers: in AI, "grounding" means anchoring answers in verified data. SureGround builds AI that stands on facts.

The site does five jobs:

1. Makes a nervous buyer feel safe within ten seconds (the home page).
2. Runs the **First Step Scorecard**, the lead magnet: a short self-assessment whose results are emailed.
3. Explains and prices the offers (core services, entry offers, specialty offers, ongoing support).
4. Publishes the blog.
5. Turns interest into a booked **AI Fit Call** (Cal.com) or a contact form message.

Owner and only operator: David Rhodes, `david@sureground.tech`. There is no login, no admin area and no database in v1. Keep it that way unless David asks.

## Guardrails (non-negotiable)

1. **Proven ground, never pioneering.** Copy never uses pioneer framing: cutting-edge, bleeding-edge, first-of-its-kind, frontier, uncharted, revolutionary, game-changing, unleash, magic, "don't get left behind". `pnpm lint:copy` enforces the list in `lib/copy/banned-words.ts`.
2. **No em dashes and no emojis anywhere:** copy, UI strings, alt text, emails, metadata, code comments that ship. Use commas, colons or periods. `pnpm lint:copy` enforces this.
3. **No invented facts.** Never invent clients, testimonials, logos, case studies, metrics or statistics. Facts about David come only from `content/facts.ts` (sourced from his resume). Market statistics come only from `content/sources.ts`, each with a URL and date, and are shown with a visible citation.
4. **Who can be named.** Former employers may be named as plain text (no logos): Feedonomics, FullStory, Shogun, AutoZone, and BloomForge (David's own former consultancy, approved 2026-11-11). Clients and partners are never named; describe them generically ("a national health system", "a Fortune 500 retailer", "a global consultancy"). Never mention Beacon and Main or AI visibility, GEO or LLM discoverability services; those belong to a separate brand.
5. **Prices and promises live in one place.** Every price, guarantee, credit window and duration lives only in `lib/config/offers.ts`. Never hard-code one in a component or MDX file. Every offer has `confirmed: boolean`; production builds fail while any published offer is unconfirmed (`pnpm check:offers`).
6. **Never claim results we cannot show.** No "guaranteed ROI". The only guarantees are the ones in `offers.ts`, worded exactly as David approves them.
7. **Privacy.** David's home address, personal phone and personal email never appear. The site stores no personal data: form and scorecard submissions go out by email and are not persisted. Never log full email addresses, names, message bodies or raw IPs.
8. **Security gate.** No phase is done and nothing is promoted to production until the OWASP audit in "Security" below has run and every Critical and High finding is fixed.
9. **Copy you write is a draft.** Wrap drafted MDX sections in `{/* COPY: draft */}` and list them in `docs/copy-review.md` until David approves them.
10. **When a business rule, price, claim or fact is unclear, stop and ask David.** Do not guess.

## Stack (locked; ask David before changing anything here)

- Next.js 16 App Router, React Server Components and Server Actions, TypeScript `strict`, Node 24, pnpm
- Vercel hosting, Vercel Analytics (cookieless, no consent banner needed)
- Tailwind CSS v4 and shadcn/ui, restyled to the tokens in "Design" below
- `next-themes` for light and dark mode (system default, manual toggle)
- `next/font` self-hosting Space Grotesk, IBM Plex Sans and IBM Plex Mono (no Google Fonts requests at runtime)
- MDX for the blog and long-form pages (`@next/mdx`); content is trusted and lives only in the repo
- Resend with React Email templates for all email
- Cloudflare Turnstile on the contact form and the scorecard (Cloudflare does not proxy the site)
- Upstash Redis through the Vercel Marketplace with `@upstash/ratelimit` for rate limiting (there is no other database)
- Cal.com embed for booking the AI Fit Call
- Zod at every boundary; Vitest for unit tests; Playwright for end-to-end tests

**This is not the Next.js in your training data.** Next.js 16 renamed middleware to `proxy.ts` and changed several APIs. Read the relevant guide in `node_modules/next/dist/docs/` before writing code, and check current official docs for every library API you are not certain of. Record version-specific choices in `docs/decisions.md`. No new dependency outside this list without a one-line reason in `docs/decisions.md`.

## Repo layout

```
app/
  (site)/
    page.tsx                  home (landing)
    services/                 index + [slug] for each offer
    pricing/
    scorecard/                First Step Scorecard flow
    about/
    blog/                     index, [slug], tag/[tag]
    contact/                  form + Cal.com embed
    legal/privacy, legal/terms
  actions/                    server actions: contact.ts, scorecard.ts
  blog/rss.xml/route.ts
  og/[...slug]/               Open Graph images
  sitemap.ts  robots.ts  not-found.tsx  error.tsx  global-error.tsx
  .well-known/security.txt/route.ts
components/
  brand/      Logo, Wordmark, StepMotif
  site/       Header, Footer, ThemeToggle, MobileNav, Section, CTA
  offers/     OfferCard, OfferLadder, PriceTag (reads offers.ts)
  scorecard/  Question, Progress, ResultSummary, EmailGate
  forms/      fields, Turnstile, FormStatus
  blog/       PostCard, PostHeader, Prose, Callout
  seo/        JsonLd
content/
  blog/*.mdx            posts (metadata export validated by Zod)
  pages/*.mdx           about, legal, long-form service sections
  services/*.ts         per-offer page content (no prices)
  scorecard.ts          questions, weights, bands, recommendations
  facts.ts              facts about David, from his resume only
  sources.ts            cited statistics (url, publisher, date)
emails/                 React Email: ContactNotify, ScorecardResult, ScorecardLeadNotify
lib/
  config/offers.ts      ALL prices, guarantees, durations, confirmed flags
  config/site.ts        name, URLs, nav, social handles
  forms/                Zod schemas, Turnstile verify, honeypot, pipeline
  scorecard/score.ts    pure scoring function (server-side source of truth)
  rate-limit.ts         Upstash limiter wrappers
  email/send.ts         the only place that calls Resend
  security/csp.ts       CSP builder shared by proxy.ts and tests
  copy/                 banned words and copy rules for lint:copy
  design/contrast.ts    contrast math for check:contrast
  env.ts  env.public.ts Zod-validated server and browser env
proxy.ts                CSP and security headers (Next.js 16 proxy)
scripts/                lint-copy, check-contrast, check-offers
tests/unit/  tests/e2e/
docs/
  brand-guide.md  research/offerings-report.md
  decisions.md  copy-review.md  launch-checklist.md
  security/audit-YYYY-MM-DD.md
```

## Commands

```
pnpm dev               # Next.js dev server
pnpm build
pnpm typecheck         # next typegen, then tsc --noEmit
pnpm lint
pnpm lint:copy         # em dashes, emojis, banned words, prices outside offers.ts
pnpm check:contrast    # every token text pair meets WCAG AA
pnpm check:offers      # fails if any published offer has confirmed: false (production builds run this)
pnpm format            # Prettier (format:check in CI)
pnpm test              # Vitest
pnpm test:watch        # Vitest in watch mode
pnpm test:e2e          # Playwright at 360px, 768px and 1280px, light and dark
pnpm audit:deps        # pnpm audit --prod --audit-level=high
```

Use Node 24 (`nvm use`, from `.nvmrc`). Keep this list true; if you add or rename a script, update it here.

## How to work

- One phase at a time, in order (see "Phases"). Start a phase with a short plan in the conversation. Finish it by meeting every acceptance criterion, running `typecheck`, `lint`, `lint:copy`, `check:contrast`, `test` and `test:e2e`, running the OWASP audit, then updating "Current status" at the bottom of this file.
- Small commits named for the phase, for example `p4: contact form rate limiting`.
- Server Components by default. Add `"use client"` only for interactivity (theme toggle, mobile nav, scorecard steps, Turnstile widget, Cal.com embed).
- Mobile first. Every page works at 360px wide with no horizontal scroll, tap targets at least 44px, and readable 16px body text.
- Accessibility: WCAG 2.2 AA, keyboard reachable, visible focus rings, semantic landmarks, labelled form fields with inline errors, `prefers-reduced-motion` respected (the step motif animates only when motion is allowed).
- Performance budget on mobile: LCP under 2.5s, CLS under 0.1, INP under 200ms; no client JavaScript on pages that do not need it.

## Design

Follow `docs/brand-guide.md` (The Engineer direction). Summary:

- **Logo:** three solid steps rising in a rounded square tile with a Volt node on the top step. SVG source is in the brand guide; build it as `components/brand/Logo.tsx`. Wordmark: **Sure**Ground, "Sure" in the text color and "Ground" in the accent text color, Space Grotesk 700, -2% tracking.
- **Type:** Space Grotesk (display, 500/700), IBM Plex Sans (body, 400/600), IBM Plex Mono (labels, section numbers, metrics). Section numbers in mono: `01 / Services`. Hero eyebrow in mono: `> grounded_ai + enablement`.
- **Radius and spacing:** cards 10px, buttons 8px, logo tile 12px; 8px spacing scale. Cards are a surface fill with a 1px border, no drop shadows.

### Theme tokens (CSS variables; Tailwind reads them)

| Token           | Dark                | Light                    | Use                                                  |
| --------------- | ------------------- | ------------------------ | ---------------------------------------------------- |
| `--bg`          | #0E1116 Carbon      | #F2F2EF Bone             | page background                                      |
| `--surface`     | #1B2029 Graphite    | #FFFFFF                  | cards, panels                                        |
| `--text`        | #F2F2EF Bone        | #0E1116 Carbon           | body and headings                                    |
| `--muted`       | #9AA3B2 Steel       | #4A5261 Iron             | secondary text                                       |
| `--border`      | #2A303A Rule        | #D9DBD3                  | dividers, card borders                               |
| `--accent-text` | #4C7DFF Signal Blue | #2A55CC Deep Signal      | links, "Ground" in wordmark                          |
| `--accent-fill` | #4C7DFF             | #4C7DFF                  | primary button fill (label is Carbon in both themes) |
| `--highlight`   | #C6F36B Volt        | #C6F36B Volt (fill only) | one detail per layout; text on Volt is always Carbon |

Measured contrast: Bone on Carbon 16.9:1; Steel on Carbon 7.4:1; Signal Blue on Carbon 5.1:1; Signal Blue on Graphite 4.4:1 (large text only, otherwise use Bone); Carbon on Signal Blue 5.1:1; Deep Signal on Bone 5.7:1; Iron on Bone 7.0:1. Signal Blue on Bone is 3.3:1, so it is never used for light-mode text. `pnpm check:contrast` must pass for every pair you add.

### Light and dark mode

- `next-themes` with `attribute="class"`, `defaultTheme="system"`, `enableSystem`, and a three-state toggle (System, Light, Dark) in the header and mobile nav, labelled for screen readers.
- No flash of the wrong theme: `suppressHydrationWarning` on `<html>`; the toggle renders a stable placeholder until mounted.
- Set `color-scheme` and the `theme-color` meta for both modes. The Cal.com embed and Turnstile widget follow the active theme.
- Playwright screenshots every page in both themes.

## Pages

### Home (`/`)

Its job is to lower the temperature, show proof, and start the scorecard. Sections in order:

1. **Hero.** Eyebrow `> grounded_ai + enablement`. H1: "You don't have to be the pioneer." Subhead: "We've walked this path. SureGround builds AI into your business on proven ground, then trains your team to run it." Primary CTA: "Check your AI readiness" (with "5 min"; label chosen by David, 2026-11-13, it opens the First Step Scorecard). Secondary CTA: "Book a free AI Fit Call". The step motif sits beside the copy; its steps draw in once on load when motion is allowed.
2. **Proof strip.** "20 years building for enterprise buyers" with former employer names as plain text from `content/facts.ts`.
3. **Why owners hold back.** Three short cards on the real barriers (privacy, accuracy, not knowing where to start), each with one cited statistic from `content/sources.ts`.
4. **Core services.** Three cards: AI Engineering, Agent Development, AI Enablement, each linking to its page.
5. **The path.** A stepped, numbered ladder (the signature visual): Step 1 Scorecard or Fit Call, Step 2 Assess, Step 3 Pilot, Step 4 Operate. Each step names its offer and reads its starting price from `offers.ts`.
6. **Risk off your plate.** The approved guarantees and credits from `offers.ts` (assessment fee credited, live-in-90-days, no lock-in).
7. **Specialty offers.** Pilot Triage, Security Questionnaire and RFP Answer Engine. (Catalog and Feed Readiness was removed on 2026-11-11, David: too soon after leaving Feedonomics. Do not bring it back unless he asks.)
8. **About teaser** with David's photo and two lines from `facts.ts`.
9. **Latest three blog posts.**
10. **Final CTA** repeating the scorecard and Fit Call.

### Services (`/services`, `/services/[slug]`)

One page per offer, generated from `content/services/*.ts` plus `offers.ts`. Each page: who it is for, the problem, what you get (deliverables list), how it works (numbered steps), duration, starting price, the guarantee or credit if any, "why SureGround" (only facts from `facts.ts`), FAQ, and a CTA. Add `Service` JSON-LD.

### Pricing (`/pricing`)

The full ladder as a table on desktop and stacked cards on mobile, every number from `offers.ts`, with "starting at" wording and a short note on fixed fees and milestone payments for the packaged offers. No hourly rates anywhere (see "Hourly work" under Offers).

### First Step Scorecard (`/scorecard`)

See "First Step Scorecard" below.

### About (`/about`)

David's story in first person, from `content/facts.ts` only, with his photo (`public/images/david-rhodes.jpg`, supplied by David; until then a neutral placeholder and an open item). Arc: journalism and advertising degree from the University of Missouri; years in enterprise sales for a media business-intelligence platform; taught himself Python, then finished Fullstack Academy (2017); freelance builder of five SaaS MVPs; senior frontend engineer on AutoZone's React and TypeScript rebuild; senior solutions engineer at Shogun, FullStory and Feedonomics (with his own consultancy, BloomForge, in between; he left Feedonomics in October 2026), working with C-level buyers, security teams and global consultancies. Why that matters to an owner: he has sat across the table from CISOs and procurement teams and knows which answers survive a review. Never say or imply he currently works anywhere other than SureGround.

### Blog (`/blog`)

See "Blog" below.

### Contact (`/contact`)

The contact form and the Cal.com inline embed for the AI Fit Call, side by side on desktop and stacked on mobile. `/contact#book` scrolls to the embed. Show `david@sureground.tech` as a plain mailto link.

### Legal (`/legal/privacy`, `/legal/terms`)

Drafts for David's review (mark them as drafts in `docs/copy-review.md`). The privacy policy lists exactly what is collected (contact form fields, scorecard answers and contact details), why, that nothing is stored on the site, where email lands (Google Workspace), and the processors: Vercel, Resend, Cloudflare Turnstile, Upstash, Cal.com and Vercel Analytics. No legal conclusions; David has a lawyer review before launch.

### Site-wide

Header: Wordmark, Services, Pricing, Scorecard, Blog, About, theme toggle, "Book a call" button. Footer: short boilerplate, nav, `david@sureground.tech`, LinkedIn, privacy and terms links, "Nashville, TN", copyright. A friendly 404 that links to the scorecard.

## Offers

All values live in `lib/config/offers.ts` with this shape: `slug`, `name`, `group`, `summary`, `deliverables[]`, `duration`, `startingAt` (number in USD or `0` for free), `cadence` (`one-time` or `monthly`), `terms` (credits and guarantees, exact approved wording), `confirmed` (boolean). The prices and terms below started as recommendations from the research report; **David confirmed all of them as written on 2026-11-09** and every offer is `confirmed: true`. Any later change needs his approval again.

### Core services (the three pillars)

| Slug                | Name              | What it is                                                                                                                                                                      | Starts at (proposed)                                    |
| ------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `ai-engineering`    | AI Engineering    | Builds AI into real workflows: integrations, data pipelines, knowledge assistants grounded in the client's own documents, evaluations. Sold as the Proven-Pattern Pilot Sprint. | $10,000 (sprint)                                        |
| `agent-development` | Agent Development | Task agents with human approval points for back-office work: intake, research, drafting, reconciliation, order and ticket handling. Sold as a Pilot Sprint or added to one.     | $10,000 (sprint)                                        |
| `ai-enablement`     | AI Enablement     | Training so teams use AI safely and well: executive briefing, team workshops, role-based playbooks, an approved-tools guide, office hours.                                      | $1,500 half-day workshop; $4,500 team program (4 weeks) |

### The ladder

| Group     | Slug                     | Name                                         | What it is                                                                                                                                       | Duration        | Starts at (proposed)        | Terms (proposed, needs approval)                                  |
| --------- | ------------------------ | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------- | --------------------------- | ----------------------------------------------------------------- |
| Start     | `fit-call`               | AI Fit Call                                  | 30-minute call plus a one-page plan with two or three candidate uses within 48 hours                                                             | 30 min + 2 days | Free                        |                                                                   |
| Start     | `safe-start`             | AI Safe Start                                | Shadow-AI inventory, risk rating per tool, acceptable-use policy, AI vendor checklist, approved-tools list                                       | 1 to 2 weeks    | $2,500                      | Your full fee comes off any next offer you start within 60 days             |
| Start     | `opportunity-assessment` | AI Opportunity Assessment                    | Workflow mapping, baseline hours, ranked opportunities with cost and ROI, 90-day roadmap with buy-versus-build picks                             | 2 to 3 weeks    | $3,500                      | Your full fee comes off a Pilot Sprint you start within 60 days             |
| Build     | `pilot-sprint`           | Proven-Pattern Pilot Sprint                  | One back-office workflow, agent or knowledge assistant on proven tools, with approval points, testing, training and a written data-handling note | 4 to 8 weeks    | $10,000, paid in milestones | Live in 90 days or we keep working at no charge                   |
| Specialty | `pilot-triage`           | AI Pilot Triage                              | Go, kill or fix verdict on up to two stalled AI projects, the named data or integration blocker, a fixed-price next step                         | 2 weeks         | $7,500                      | Half your fee comes off a build with us; fee returned if no blocker is named |
| Specialty | `answer-engine`          | Security Questionnaire and RFP Answer Engine | Curated answer library, AI-governance answer set, tool selection and setup, refresh process for B2B sellers                                      | 3 to 4 weeks    | $7,500                      | Optional upkeep $750 per month                                    |
| Operate   | `managed-ops`            | Managed AI Operations                        | Monitoring, maintenance, a monthly block of improvements, plain-language monthly report                                                          | Monthly         | $1,000 per month            | Month to month, no lock-in                                        |
| Operate   | `fractional-se`          | Fractional AI Solutions Engineer             | Hands-on AI lead: roadmap, vendor approvals, governance updates, customer security answers, one build slot                                       | 3-month minimum | $5,000 per month            |                                                                   |

### Hourly work (David, 2026-11-09)

The packaged offers above keep their fixed prices. David also bills hourly for work outside a package (extra scope, ad hoc help). The hourly rate is private: it never appears on the site, in emails, on LinkedIn copy you draft, or anywhere in this repo (the repo is public). Copy must not say or imply SureGround never bills by the hour; say the packaged offers have fixed fees instead. If an hourly option ever needs to be shown, ask David first.

Boundaries: no catalog, product-feed or AI-assistant visibility offer. Healthcare-adjacent offers target vendors' sales and security processes, never clinical data integration. Case studies (for example the AI session summary feature David prototyped at FullStory, or his RFP tooling for a 500-question insurer RFP) appear only as proof points with facts from `facts.ts`, never as priced offers.

## First Step Scorecard

A five-minute self-assessment that tells an owner how solid their ground is and what their first step should be. It is a self-assessment, not an audit, and the results say so.

**Questions.** 12 multiple-choice questions, two per dimension, each answer worth 0 to 4 points, defined in `content/scorecard.ts`:

1. Goals: do you know which problems AI should solve?
2. Workflows: are the target processes documented and repeatable?
3. Data: is the information AI would need organized and accessible?
4. People: does the team have time and basic AI skills?
5. Safety: is there a policy for which AI tools staff may use and what data they may share?
6. Tools: are current systems connected, or do people re-key data between them?

**Scoring.** `lib/scorecard/score.ts` is a pure function: answers in, total (0 to 48), per-dimension scores, band and recommended next offer out. Bands (copy drafts): 36 to 48 "Solid ground", 24 to 35 "Firm footing", 12 to 23 "Uneven ground", 0 to 11 "Soft ground". The recommendation maps the weakest dimension to an offer (Safety to AI Safe Start; Goals, Workflows, Data and Tools to AI Opportunity Assessment; People to AI Enablement; every area ready to the Pilot Sprint), then swaps build offers for teams that can build (`teamOverrides`). Mapping approved by David, 2026-11-13. Unit-test every band boundary and every mapping. No AI model is called anywhere in the scorecard.

**Flow (email required for results, as David decided).**

1. One question per screen on mobile, a progress bar, back and next, answers kept in client state only (never in the URL or local storage).
2. Email gate: first name, work email, company name, company size (enum), role (enum), who would build and run an AI project today (enum, unscored; a team that can build gets a non-build offer, see `teamOverrides`), a required checkbox "Email me my results", Turnstile, honeypot.
3. Server action `app/actions/scorecard.ts`: verify Turnstile, check the honeypot, rate-limit by IP and by email hash, validate every answer against the enum in `scorecard.ts` with Zod, **recompute the score on the server** (never trust a client score), send `ScorecardResult` to the visitor and `ScorecardLeadNotify` to `CONTACT_TO_EMAIL`, then return the result for display.
4. Results screen: band, per-dimension bars, two or three plain-language observations, the recommended first step with its starting price, CTAs to book a Fit Call and to read the matching service page. Nothing is persisted; refreshing the page clears it.

**Abuse rules.** The result email contains only our fixed text and the score: never echo the visitor's free text (not even the first name) into an email sent to the address they typed, so the form cannot be used to send messages to third parties. The lead notification to David may include the submitted fields, rendered as escaped text.

## Contact form

Fields: name (max 80), email, company (optional, max 120), topic (enum: Fit Call question, Services, Speaking or workshop, Other), message (max 2,000), honeypot, Turnstile. Server action `app/actions/contact.ts` runs the shared pipeline in `lib/forms/`: Turnstile verify, honeypot, rate limit, Zod parse, then `ContactNotify` to `CONTACT_TO_EMAIL` with `reply_to` set to the visitor's validated address. No auto-reply to the visitor. On any failure show a clear error and never a false success.

## Blog

- Posts are MDX files in `content/blog/<slug>.mdx`; their metadata (slug, title, description, date, updated, tags, draft, readingMinutes, ogImage optional) lives in `content/blog/posts.ts`, validated with Zod at build time. Invalid metadata fails the build. See `docs/decisions.md`.
- Routes: `/blog` (paginated index with tags), `/blog/[slug]` (static, `dynamicParams = false`), `/blog/tag/[tag]`, `/blog/rss.xml`.
- Each post: reading time, `BlogPosting` JSON-LD, Open Graph image, canonical URL, previous and next links, and a closing CTA to the scorecard.
- Drafts (`draft: true`) build locally but are excluded from production, the sitemap and RSS.
- MDX components available to posts: `Callout`, `Figure`, `Stat` (takes a `sources.ts` id and renders the citation), `OfferLink` (takes an offer slug and reads the price from `offers.ts`).
- Seeded outline drafts were removed at David's request (2026-11-13). Do not add draft posts unless he asks; possible future topics: the AI pioneer, shadow AI, what a security reviewer will ask about your AI vendor.

## Security

The site must hold up to the OWASP Top 10:2025. Build these controls in from the first phase.

### Required controls

- **A01 Broken Access Control.** No auth surfaces in v1. Blog slugs come only from `generateStaticParams` with `dynamicParams = false`. No user-controlled redirects. No server code fetches a user-supplied URL. Confirm Server Action origin checks are active, and restrict the Server Actions allowed-origins setting (check the current Next.js 16 config key) to the production and preview hosts only.
- **A02 Security Misconfiguration.** Headers on every response from `proxy.ts`: Content-Security-Policy, Strict-Transport-Security (`max-age=63072000; includeSubDomains`; add `preload` only after David confirms every subdomain serves HTTPS), X-Content-Type-Options `nosniff`, Referrer-Policy `strict-origin-when-cross-origin`, X-Frame-Options `DENY` plus CSP `frame-ancestors 'none'`, Permissions-Policy denying camera, microphone, geolocation and browsing-topics, Cross-Origin-Opener-Policy `same-origin`. `poweredByHeader: false`; no production browser source maps; Vercel deployment protection on previews.
- **CSP.** Built in `lib/security/csp.ts` and unit tested. Allow only `'self'` plus the hosts that need it: Cal.com embed, Cloudflare Turnstile (`challenges.cloudflare.com`), Vercel Analytics. No `'unsafe-eval'`. For scripts, check the current Next.js 16 docs for the hash or SRI option that keeps static rendering; fall back to per-request nonces in `proxy.ts` if needed, and record the choice and its rendering cost in `docs/decisions.md`. `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `upgrade-insecure-requests`.
- **A03 Software Supply Chain.** Exact versions in `package.json`, committed `pnpm-lock.yaml`, `pnpm install --frozen-lockfile` in CI, `pnpm audit:deps` in CI failing on High, Dependabot for npm and GitHub Actions, GitHub Actions pinned to commit SHAs, and only explicitly allowed packages may run install scripts (pnpm `onlyBuiltDependencies`). Keep the dependency list short.
- **A04 Cryptographic Failures.** HTTPS everywhere via Vercel and HSTS. Secrets only in Vercel environment variables and `.env.local` (never committed; `.env.example` lists names only). `lib/env.ts` validates server env with Zod and is imported only by server code; `lib/env.public.ts` exposes only `NEXT_PUBLIC_*`. Email and IP are hashed with SHA-256 plus a server-side salt before use as rate-limit keys.
- **A05 Injection.** React escaping everywhere; no `dangerouslySetInnerHTML` except JSON-LD, which goes through one helper that escapes `<`. Email templates are React Email components, never string-built HTML. Strip CR and LF from any value used in an email header or subject; `reply_to` only after Zod email validation. MDX is compiled only from repo files, never from user input.
- **A06 Insecure Design.** Turnstile, honeypot and rate limits on both forms (proposed: 5 per IP per 10 minutes and 3 per email hash per day for the scorecard; 5 per IP per hour for contact). Server Action body size limit kept small. Every field has a max length. Scorecard answers are enums. No email is ever sent to a visitor-supplied address with visitor-supplied content.
- **A07 Authentication Failures.** No site auth. David enables MFA on GitHub, Vercel, Resend, Cloudflare, Upstash, Cal.com, Google Workspace and the domain registrar (tracked in `docs/launch-checklist.md`).
- **A08 Software or Data Integrity.** No deserialization of untrusted data beyond Zod-validated JSON. If a Cal.com webhook is ever added, verify its signature before use. Third-party scripts load only from CSP-allowed hosts.
- **A09 Logging and Alerting.** Log security events as structured JSON without PII: Turnstile failures, honeypot hits, rate-limit blocks, validation failures, email send failures. David gets one alert email if send failures or rate-limit blocks spike (simple threshold in Upstash).
- **A10 Exceptional Conditions.** Fail closed: if Turnstile verification errors or times out, reject; if Resend fails, show an error and never claim success. `error.tsx` and `global-error.tsx` show friendly messages with no stack traces or internal details.
- Publish `/.well-known/security.txt` with `Contact: mailto:david@sureground.tech` and an `Expires` date one year out.

### OWASP audit gate

Run the `/owasp-security-audit:security-audit` skill:

- at the end of every phase, scoped to the files that phase changed;
- before the first production launch and before any release that touches `app/actions/`, `lib/forms/`, `lib/email/`, `proxy.ts`, `lib/security/` or `next.config.ts`, as a full audit of all ten categories.

Save each report to `docs/security/audit-YYYY-MM-DD.md`. Every Critical and High finding is fixed before the phase closes. Medium and Low findings are fixed or written into `docs/decisions.md` with a reason and owner. Follow the skill's own rules: static review by default, never print secret values, and ask David before running any command it flags as executing code or touching the network.

## Email

- Resend sends from a subdomain so it does not collide with Google Workspace mail: verify `send.sureground.tech` (or the subdomain Resend recommends) in Resend and add its DNS records at the registrar. From: `SureGround <hello@send.sureground.tech>`; Reply-To: `david@sureground.tech`.
- `lib/email/send.ts` is the only caller of Resend. In development, `EMAIL_TRANSPORT=outbox` writes rendered emails to `.outbox/` instead of sending.
- Templates use the brand palette in light mode, a plain-text part, and the footer "SureGround, Nashville, TN" with a link to the privacy policy. No tracking pixels.

## SEO and metadata

Per-page `generateMetadata` (title template "%s | SureGround"), canonical URLs, Open Graph and Twitter cards with generated images, `sitemap.ts`, `robots.ts` (allow all; scorecard results are never a URL, so there is nothing to disallow), JSON-LD: `ProfessionalService` (Nashville, TN; area served: United States), `Person` for David on `/about`, `Service` per offer, `BlogPosting` per post, `BreadcrumbList`.

## Environment variables

Document every variable in `.env.example` (names only) and validate in `lib/env.ts`:

```
NEXT_PUBLIC_SITE_URL=https://sureground.tech
CONTACT_TO_EMAIL=david@sureground.tech
EMAIL_FROM="SureGround <hello@send.sureground.tech>"
EMAIL_TRANSPORT=resend            # outbox in development
RESEND_API_KEY=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
RATE_LIMIT_SALT=
NEXT_PUBLIC_CAL_LINK=             # e.g. sureground/ai-fit-call
```

A production build fails if any required variable is missing. "Required" grows with the site: `lib/env.schema.ts` groups variables by feature and `enabledFeatures` lists the groups production requires (now `core` and `email`; Phase 4 adds `forms` and `booking`). A unit test fails if code uses a variable from a group that is not enabled.

## Phases

| #   | Phase                   | Acceptance criteria                                                                                                                                                                                                                                                                                                                         |
| --- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | Foundation              | Next.js 16 app on Node 24 with pnpm; strict TS; ESLint, Prettier; `lint:copy`, `check:contrast`, `check:offers` scripts; `lib/env.ts`; security headers and CSP baseline in `proxy.ts`; CI (GitHub Actions) running typecheck, lint, lint:copy, format:check, test, audit:deps; Dependabot; Vercel project linked; first OWASP audit saved. |
| 1   | Design system and shell | Tokens for both themes, fonts via `next/font`, Logo and Wordmark, Header, Footer, MobileNav, three-state ThemeToggle with no flash, 404 and error pages; contrast check passes; Playwright screenshots at 360, 768 and 1280 in both themes.                                                                                                 |
| 2   | Marketing pages         | Home, Services index and pages, Pricing, About (placeholder photo), Legal drafts; all prices from `offers.ts`; facts from `facts.ts`; stats from `sources.ts`; JSON-LD; copy drafts listed in `docs/copy-review.md`.                                                                                                                        |
| 3   | Blog                    | MDX pipeline with Zod-validated metadata, index, post, tag pages, RSS, OG images, drafts excluded from production. (Seeded draft posts dropped by David, 2026-11-13.)                                                                                                                                                                                                |
| 4   | Contact and booking     | Contact form pipeline (Turnstile, honeypot, rate limit, Zod, Resend, outbox in dev); Cal.com inline embed themed to the site; CSP updated for both; unit tests for the pipeline and an e2e test with Turnstile test keys.                                                                                                                   |
| 5   | First Step Scorecard    | Questions, scoring, bands and recommendations in content files; the flow at 360px; server-side scoring; both emails; abuse rules met; unit tests for every band boundary and mapping; e2e test of the full flow.                                                                                                                            |
| 6   | Launch hardening        | Full OWASP audit with no open Critical or High; Lighthouse mobile 95+ for performance, accessibility, best practices and SEO on home, a service page, a post and the scorecard; securityheaders.com grade A or better; `check:offers` passes (David confirmed every price); `docs/launch-checklist.md` complete.                            |

## Launch checklist (track in `docs/launch-checklist.md`)

- sureground.tech added to Vercel; DNS records set at the registrar; `www` redirects to the apex
- Resend sending subdomain verified; Google Workspace SPF, DKIM and DMARC in place for the root domain
- Turnstile site and secret keys in Vercel Production and Preview
- Upstash Redis provisioned through the Vercel Marketplace
- Cal.com event "AI Fit Call (30 min)" created and `NEXT_PUBLIC_CAL_LINK` set
- MFA on every account listed under A07
- David's headshot added; About copy approved
- Every offer `confirmed: true`; guarantees approved word for word
- Privacy policy and terms reviewed by a lawyer
- Trademark: use "SureGround" without the registered symbol until a registration issues

## Open items for David

1. Done 2026-11-09: every price, duration, credit and guarantee in the Offers section confirmed as written, including both AI Enablement prices.
2. Done 2026-11-09: Vercel team moved to Pro.
3. Done 2026-11-09: headshot saved as `public/images/david-rhodes.jpg`. Still open: approve the About story, the facts in `content/facts.ts` and the Phase 2 copy in `docs/copy-review.md`.
4. Done 2026-11-13: scorecard questions, answers, bands, observations, recommendations and tie order approved.
5. Create the Cal.com event and Resend, Turnstile and Upstash accounts.
6. LinkedIn company page set (linkedin.com/company/sureground, in the footer). Any other social handles are still open.

## Current status

**Phase 5 (First Step Scorecard): done, 2026-11-13** (merged as PR 17).

- `/scorecard`: 12 questions one per screen, email gate (Turnstile, honeypot, consent, an unscored in-house team question that swaps build offers for teams that can build), results with per-area bars, observations and a recommended first step priced from `offers.ts`. Answers live in React state only.
- Content in `content/scorecard.ts`; pure scoring in `lib/scorecard/score.ts`; Server Action `app/actions/scorecard.ts` recomputes the score from answer ids, limits by IP and email hash, sends `ScorecardLeadNotify` to David then `ScorecardResult` (fixed text and score only) to the visitor.
- `/scorecard` has its own CSP (Turnstile only); header and footer links to it are full page loads.
- Checks passing: typecheck, lint, lint:copy, check:contrast, check:offers, format:check, test (154), test:e2e (641: 614 passed, 27 skipped; one timeout under load fixed by a longer limit, passed on rerun), audit:deps.
- OWASP audit (full): `docs/security/audit-2026-11-13-phase5.md`, one Low found and fixed, two Informational accepted.
- David approved the scorecard content on 2026-11-13 (open item 4). The other Phase 5 copy in `docs/copy-review.md` (page, gate, results screen, emails, error messages) is still a draft.

**Phase 4 (Contact and booking): done, 2026-11-13** (merged as PR 16).

- `/contact` with the contact form (Server Action `app/actions/contact.ts` through the shared pipeline in `lib/forms/`: Turnstile, honeypot, Upstash rate limit of 5 per IP per hour, Zod, then `ContactNotify` to `CONTACT_TO_EMAIL` with reply-to) and the Cal.com inline embed (`@calcom/embed-react`), both themed.
- `lib/email/send.ts` (Resend, or `.outbox/` in development), `lib/rate-limit.ts`, spike alert emails (`lib/security/alert.ts`).
- Per-page CSP: only `/contact` allows Turnstile, Cal.com and inline styles; links to it are full page loads. See `docs/decisions.md`.
- `enabledFeatures` now includes `forms` and `booking`: production builds need the Turnstile keys, Upstash variables, `RATE_LIMIT_SALT` and `NEXT_PUBLIC_CAL_LINK` (all set in Vercel). Upstash is connected as `KV_REST_API_*`, mapped by `withEnvAliases`.
- OWASP audit (full): `docs/security/audit-2026-11-13-phase4.md`, one Low fixed, one Low accepted.

**Phase 3 (Blog): done, 2026-11-13** (merged as PR 15).

- MDX pipeline (`@next/mdx`), metadata registry with Zod, `/blog` (paginated), `/blog/[slug]`, `/blog/tag/[tag]`, `/blog/rss.xml`, Open Graph images, BlogPosting and BreadcrumbList JSON-LD, previous and next links, a closing scorecard CTA, latest three posts on the home page, blog in the sitemap.
- First published post: "Google AI Mode Now Books Home Services: What Local Owners Should Do Next" (David's, reworked with him in a Claude Doc). The three seeded outline drafts were removed at David's request.
- Checks passing: typecheck, lint, lint:copy, check:contrast, check:offers, format:check, test (86), test:e2e (522), audit:deps.
- OWASP audit (full, since `next.config.ts` changed): `docs/security/audit-2026-11-13-phase3.md`, one Low found and fixed, nothing open.

**Phase 2 (Marketing pages): done, 2026-11-10** (branch `p2/marketing-pages`).

- Home, Services index, 12 service pages, Pricing, About (with the headshot), privacy and terms drafts; `sitemap.ts` and `robots.ts`.
- `content/facts.ts` (from the resume, no personal details, no end dates), `content/sources.ts` (three cited stats), `content/services/*.ts` (words only; prices and terms from `offers.ts`).
- JSON-LD: ProfessionalService, Person, Service, BreadcrumbList.
- Checks passing: typecheck, lint, lint:copy, check:contrast, check:offers, format:check, test (71), test:e2e (438), audit:deps.
- OWASP audit: `docs/security/audit-2026-11-10-phase2.md`, no findings.
- All new copy is listed as a draft in `docs/copy-review.md`. Home latest-posts section waits for Phase 3.
- David's review round, 2026-11-11: copy edits on home, AI Engineering and About; Catalog and Feed Readiness removed (11 offers now); plain-language credit terms approved; path cards equal height.

**Phase 1 (Design system and shell): done, 2026-11-09** (branch `p1/design-shell`).

- Brand tokens for both themes in `app/globals.css` (kept in sync with `lib/design/tokens.ts` by a unit test); default Tailwind palette removed; brand type scale as `text-display` through `text-label`.
- Space Grotesk, IBM Plex Sans and IBM Plex Mono via `next/font` (served from the site).
- `Logo`, `Wordmark`, `Header`, `Footer`, `MobileNav` (native modal dialog), three-state `ThemeToggle` (next-themes, nonce on its script, no flash, works without JavaScript), skip link, 404, `error.tsx` and `global-error.tsx`.
- Checks passing: typecheck, lint, lint:copy, check:contrast, check:offers, format:check, test (52), test:e2e (102, with full-page screenshots at 360/768/1280 in light and dark, uploaded by CI), audit:deps.
- OWASP audit: `docs/security/audit-2026-11-09-phase1.md`, no Critical, High, Medium or Low; two Informational items accepted in `docs/decisions.md`.
- David confirmed every offer (all `confirmed: true`) and moved Vercel to Pro. Vercel has the core and email variables (Resend keys, separate for Production and Preview) and a rate-limit salt per environment; Turnstile, Upstash and Cal.com come in Phase 4.

**Phase 0 (Foundation): done, 2026-11-09.** Repo `dfrho/sureground-tech`, CI and Dependabot on, Vercel project `david-rhodes-projects/sureground-tech` (Node 24, Standard protection). Nonce CSP and headers in `proxy.ts`; audit `docs/security/audit-2026-11-09.md`.

Next: Phase 6 (Launch hardening), in progress on branch `p6/launch-hardening`.

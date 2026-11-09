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

## Server Actions origin check (Phase 0)

- Next.js 16 `experimental.serverActions.allowedOrigins` lists _extra_ hosts. Left empty, only the deployment's own host is accepted, which covers production and each preview URL. Body limit is `64kb`.
- Next.js lets a Server Action through with only a warning when the request has no `Origin` header. `proxy.ts` closes that gap: any non-GET/HEAD/OPTIONS request without an `Origin` whose host equals `x-forwarded-host` (Vercel sets it) or `host` gets a 403 and an `origin_rejected` security log line. If a webhook route is ever added (for example Cal.com), it needs an explicit exemption plus signature verification.

## Environment validation (Phase 0)

- `lib/env.schema.ts` holds the Zod schemas without `server-only`, so build scripts and tests can import it. `lib/env.ts` (server, imports `server-only`) and `lib/env.public.ts` (browser) wrap it.
- `pnpm build` runs `scripts/check-env.ts` first. On Vercel production (`VERCEL_ENV=production`) every variable in `productionRequired` must be set and `EMAIL_TRANSPORT` must be `resend`. Elsewhere it validates only what is set, so local and preview builds work before accounts exist.
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
- **Fonts:** `next/font/google` downloads Space Grotesk, IBM Plex Sans and IBM Plex Mono at build time and serves them from the site, so `font-src 'self'` is enough and visitors never contact Google. Builds need network access to Google Fonts.
- **Favicon:** the scaffold `favicon.ico` was replaced by `app/icon.svg` (primary mark).
- **Error pages:** `error.tsx` and `global-error.tsx` show fixed text and never the error message or digest. `global-error.tsx` follows the operating-system theme only, since next-themes is not loaded there.
- **E2E screenshots:** `tests/e2e/shell.spec.ts` saves a full-page screenshot of every page in every project (360, 768, 1280 by light and dark) to `test-results/`; CI uploads them as the `playwright-screenshots` artifact for 14 days. They are review artifacts, not pixel-diff baselines: baselines differ between macOS and the Linux CI runner.
- **Known until Phase 2:** header and footer links point to pages that do not exist yet. Their background prefetches return 404 RSC responses whose bodies never finish, so tests must not wait for `networkidle`.

## Dependencies added outside the CLAUDE.md stack

| Package                             | Reason                                                               |
| ----------------------------------- | -------------------------------------------------------------------- |
| `server-only`                       | Makes a client bundle fail at build time if it imports `lib/env.ts`. |
| `tsx` (dev)                         | Runs the TypeScript check scripts in `scripts/`.                     |
| `prettier-plugin-tailwindcss` (dev) | Stable class order so diffs stay small.                              |

## Accepted risks and open findings

See `docs/security/audit-2026-11-09.md` for the Phase 0 audit. Medium and Low items not fixed are listed there with an owner.

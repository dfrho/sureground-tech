# Launch checklist

Owner: David unless noted. Check items off as they are done.

## Accounts and DNS

- [x] GitHub repository created (private, dfrho/sureground-tech) and pushed; CI green (2026-11-09)
- [x] Vercel project `david-rhodes-projects/sureground-tech` created and linked to the GitHub repository (2026-11-09)
- [x] Vercel deployment protection on (Standard: every deployment except the custom domain needs a Vercel login)
- [x] Vercel team moved from Hobby to Pro (David, 2026-11-09)
- [ ] sureground.tech added to Vercel; DNS records set at the registrar; `www` redirects to the apex
- [x] Resend sending subdomain `send.sureground.tech` verified; a preview test send was delivered (2026-11-13)
- [x] Google Workspace SPF, DKIM and DMARC records in place for the root domain (checked with dig, 2026-11-13; DMARC is `p=none` for now)
- [ ] Google Admin: click "Start authentication" under Apps, Google Workspace, Gmail, Authenticate email, and confirm the status reads "Authenticating email"
- [x] Turnstile site and secret keys in Vercel Production and Preview (2026-11-13)
- [x] Upstash Redis provisioned through the Vercel Marketplace (connected as `KV_REST_API_*`, 2026-11-13)
- [x] `RATE_LIMIT_SALT` generated (32+ random characters) and set in Vercel, one per environment
- [x] Cal.com event "AI Fit Call (30 min)" created and `NEXT_PUBLIC_CAL_LINK` set (format `username/event-slug`)
- [x] Phase 4 merge gate: production builds now require the Turnstile keys, the Upstash variables, `RATE_LIMIT_SALT` and `NEXT_PUBLIC_CAL_LINK` in Vercel Production
- [x] Every variable in `.env.example` set in Vercel Production (names checked with `vercel env ls`, 2026-11-13)

## GitHub repository (public since 2026-11-09)

- [x] Ruleset on `main`: pull requests only, `checks` and `e2e` required, no force pushes or deletion; auto-merge on
- [x] Secret scanning and push protection on (2026-11-10)
- [x] Dependabot alerts and security updates on (2026-11-10)

## MFA (A07)

- [ ] GitHub
- [x] Vercel (2FA on, confirmed by David 2026-11-13)
- [ ] Resend
- [ ] Cloudflare
- [ ] Upstash
- [ ] Cal.com
- [ ] Google Workspace
- [ ] Domain registrar

## Content and approvals

- [x] David's headshot added at `public/images/david-rhodes.jpg` (1600px web copy, metadata removed, 2026-11-09)
- [ ] About copy approved
- [x] Every offer `confirmed: true`; guarantees approved word for word (`pnpm check:offers` passes) (David, 2026-11-09)
- [x] Scorecard questions, band names and recommendations approved (David, 2026-11-13)
- [x] LinkedIn company page: linkedin.com/company/sureground (2026-11-09)
- [ ] Any other social handles chosen
- [ ] Privacy policy and terms reviewed by a lawyer (David is engaging an attorney, 2026-11-11)
- [ ] Every row in `docs/copy-review.md` approved
- [ ] Trademark: "SureGround" used without the registered symbol until a registration issues

## Security and quality gates (Claude)

- [ ] Full OWASP audit, no open Critical or High
- [ ] HSTS `preload` added only after David confirms every subdomain serves HTTPS
- [ ] securityheaders.com grade A or better
- [ ] Lighthouse mobile 95+ (performance, accessibility, best practices, SEO) on home, a service page, a post and the scorecard
- [ ] `security.txt` Expires date renewed (yearly)

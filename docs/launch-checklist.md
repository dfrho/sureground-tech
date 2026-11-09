# Launch checklist

Owner: David unless noted. Check items off as they are done.

## Accounts and DNS

- [ ] GitHub repository created and this repo pushed; CI green
- [ ] Vercel project created and linked to the repository
- [ ] Vercel deployment protection on for preview deployments
- [ ] sureground.tech added to Vercel; DNS records set at the registrar; `www` redirects to the apex
- [ ] Resend sending subdomain (`send.sureground.tech` or Resend's recommendation) verified
- [ ] Google Workspace SPF, DKIM and DMARC in place for the root domain
- [ ] Turnstile site and secret keys in Vercel Production and Preview
- [ ] Upstash Redis provisioned through the Vercel Marketplace
- [ ] `RATE_LIMIT_SALT` generated (32+ random characters) and set in Vercel
- [ ] Cal.com event "AI Fit Call (30 min)" created and `NEXT_PUBLIC_CAL_LINK` set
- [ ] Every variable in `.env.example` set in Vercel Production

## MFA (A07)

- [ ] GitHub
- [ ] Vercel
- [ ] Resend
- [ ] Cloudflare
- [ ] Upstash
- [ ] Cal.com
- [ ] Google Workspace
- [ ] Domain registrar

## Content and approvals

- [ ] David's headshot added at `public/images/david-rhodes.jpg`; About copy approved
- [ ] Every offer `confirmed: true`; guarantees approved word for word (`pnpm check:offers` passes)
- [ ] Scorecard questions, band names and recommendations approved
- [ ] LinkedIn company URL and other social handles chosen
- [ ] Privacy policy and terms reviewed by a lawyer
- [ ] Every row in `docs/copy-review.md` approved
- [ ] Trademark: "SureGround" used without the registered symbol until a registration issues

## Security and quality gates (Claude)

- [ ] Full OWASP audit, no open Critical or High
- [ ] HSTS `preload` added only after David confirms every subdomain serves HTTPS
- [ ] securityheaders.com grade A or better
- [ ] Lighthouse mobile 95+ (performance, accessibility, best practices, SEO) on home, a service page, a post and the scorecard
- [ ] `security.txt` Expires date renewed (yearly)

# Brand files

Exported from the SVG in `docs/brand-guide.md` section 4.

| File                                                  | Use                                                                                                |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `logo/sureground-mark-primary.svg`, `-512/-1024.png`  | Signal Blue tile, rounded, transparent corners. Dark backgrounds, slides, documents.               |
| `logo/sureground-mark-reversed.svg`, `-512/-1024.png` | Carbon tile, rounded, transparent corners. Light backgrounds and print.                            |
| `logo/sureground-mark-primary-square*`                | Full-bleed square. Avatars that add their own frame or flatten transparency (LinkedIn, X, GitHub). |
| `linkedin/linkedin-banner-2256x382.png`               | LinkedIn company page cover (2x of LinkedIn's 1128x191).                                           |

Open item: the brand guide describes three steps, but its SVG path draws two (the first step has zero height). Every file here follows the SVG as written until David decides.

To re-export the PNGs after changing an SVG: `node scripts/export-logos.mjs` (uses the Playwright Chromium from the e2e tests).

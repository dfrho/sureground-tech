/**
 * pnpm check:offers
 * Fails while any published offer in lib/config/offers.ts has confirmed: false.
 * Every offer in that file is published.
 *
 * With --production-only it fails only on Vercel production builds
 * (VERCEL_ENV=production) and just reports otherwise; `pnpm build` uses this.
 */
import { offers, unconfirmedOffers } from "../lib/config/offers";

const productionOnly = process.argv.includes("--production-only");
const enforce = !productionOnly || process.env.VERCEL_ENV === "production";

const pending = unconfirmedOffers(offers);
if (pending.length === 0) {
  console.log(`check:offers passed: all ${offers.length} offers confirmed.`);
  process.exit(0);
}

const list = pending.map((o) => `  ${o.slug}`).join("\n");
const message = `${pending.length} of ${offers.length} offers are not confirmed by David:\n${list}`;

if (enforce) {
  console.error(`check:offers failed. ${message}`);
  process.exit(1);
}
console.warn(`check:offers (not enforced outside production): ${message}`);

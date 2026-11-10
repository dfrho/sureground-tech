/**
 * Re-exports the logo PNGs in docs/brand/logo from their SVG sources using
 * the Playwright Chromium the e2e tests already install. Run after any change
 * to the mark: node scripts/export-logos.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

const dir = fileURLToPath(new URL("../docs/brand/logo/", import.meta.url));
const exports = [
  { svg: "sureground-mark-primary.svg", sizes: [512, 1024], transparent: true },
  { svg: "sureground-mark-reversed.svg", sizes: [512, 1024], transparent: true },
  { svg: "sureground-mark-primary-square.svg", sizes: [400, 1024], transparent: false },
];

const browser = await chromium.launch();
for (const { svg, sizes, transparent } of exports) {
  const source = readFileSync(dir + svg, "utf8");
  for (const size of sizes) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    const sized = source.replace(/width="64" height="64"/, `width="${size}" height="${size}"`);
    await page.setContent(`<body style="margin:0;background:transparent">${sized}</body>`);
    const out = svg.replace(/\.svg$/, `-${size}.png`);
    await page.locator("svg").screenshot({ path: dir + out, omitBackground: transparent });
    await page.close();
    console.log(`wrote docs/brand/logo/${out}`);
  }
}
await browser.close();

/**
 * pnpm check:contrast
 * Every text pair in lib/design/tokens.ts must meet WCAG 2.2 AA in each theme.
 */
import { contrastRatio, meetsAA } from "../lib/design/contrast";
import { textPairs, tokens, type Theme } from "../lib/design/tokens";

let failures = 0;
for (const pair of textPairs) {
  for (const theme of pair.themes ?? (Object.keys(tokens) as Theme[])) {
    const fg = tokens[theme][pair.fg];
    const bg = tokens[theme][pair.bg];
    const ratio = contrastRatio(fg, bg);
    const ok = meetsAA(ratio, pair.large);
    if (!ok) failures++;
    console.log(
      `${ok ? "pass" : "FAIL"}  ${theme.padEnd(5)}  ${pair.fg} on ${pair.bg}  ${ratio.toFixed(2)}:1` +
        `  (needs ${pair.large ? "3" : "4.5"}:1${pair.large ? ", large text" : ""})`,
    );
  }
}

if (failures > 0) {
  console.error(`\ncheck:contrast found ${failures} failing pair(s).`);
  process.exit(1);
}
console.log("\ncheck:contrast passed.");

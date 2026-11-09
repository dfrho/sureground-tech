/**
 * pnpm lint:copy
 * Fails on em dashes, emojis, banned pioneer and hype phrases, and dollar
 * amounts outside lib/config/offers.ts, in every file that ships.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative, sep } from "node:path";

import { checkCopy } from "../lib/copy/rules";

const root = process.cwd();

/** Directories and root files whose contents ship to visitors. */
const INCLUDE_DIRS = ["app", "components", "content", "emails", "lib", "public"];
const INCLUDE_FILES = ["proxy.ts", "next.config.ts"];
const EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".mdx",
  ".md",
  ".css",
  ".json",
  ".txt",
  ".svg",
  ".html",
]);

/** The banned list must name the banned words, so it is exempt. */
const SKIP = new Set(["lib/copy/banned-words.ts"]);
/** The single home for prices. */
const PRICE_ALLOWED = new Set(["lib/config/offers.ts"]);

function walk(dir: string, out: string[]): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (name === "node_modules" || name.startsWith(".next")) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (EXTENSIONS.has(extname(name))) out.push(full);
  }
}

const files: string[] = [];
for (const d of INCLUDE_DIRS) walk(join(root, d), files);
for (const f of INCLUDE_FILES) files.push(join(root, f));

let failures = 0;
for (const file of files) {
  const rel = relative(root, file).split(sep).join("/");
  if (SKIP.has(rel)) continue;
  let text: string;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  for (const f of checkCopy(text, { allowPrices: PRICE_ALLOWED.has(rel) })) {
    failures++;
    console.error(`${rel}:${f.line}:${f.column}  ${f.rule}  ${JSON.stringify(f.match)}`);
  }
}

if (failures > 0) {
  console.error(`\nlint:copy found ${failures} problem(s).`);
  process.exit(1);
}
console.log(`lint:copy passed (${files.length} files).`);

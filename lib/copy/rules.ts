import { bannedPhrases } from "./banned-words";

/**
 * Copy rules shared by scripts/lint-copy.ts and its unit tests.
 * Pure functions: text in, findings out.
 */

export type CopyRule = "em-dash" | "emoji" | "banned-phrase" | "price-outside-offers";

export interface CopyFinding {
  rule: CopyRule;
  line: number;
  column: number;
  match: string;
}

const EM_DASH = /[\u2014\u2015]/g;
// Pictographic emoji plus keycap and flag sequences. Plain digits, # and *
// are Emoji code points too, so they are excluded via Extended_Pictographic.
const EMOJI = /\p{Extended_Pictographic}|\p{Regional_Indicator}|\u20E3/gu;
// A dollar sign followed by a digit, as in a written price.
const PRICE = /\$\s?\d/g;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const BANNED = new RegExp(
  `(?<![\\p{L}\\p{N}])(?:${bannedPhrases
    .map((p) =>
      escapeRegExp(p)
        .replace(/[-\s]+/g, "[-\\s]+")
        .replace(/'/g, "['\u2019]?"),
    )
    .join("|")})(?![\\p{L}\\p{N}])`,
  "giu",
);

function collect(text: string, pattern: RegExp, rule: CopyRule, out: CopyFinding[]): void {
  const lineStarts = [0];
  for (let i = 0; i < text.length; i++) if (text[i] === "\n") lineStarts.push(i + 1);
  for (const m of text.matchAll(pattern)) {
    const index = m.index ?? 0;
    let line = 0;
    while (line + 1 < lineStarts.length && lineStarts[line + 1] <= index) line++;
    out.push({ rule, line: line + 1, column: index - lineStarts[line] + 1, match: m[0] });
  }
}

export function checkCopy(text: string, options: { allowPrices?: boolean } = {}): CopyFinding[] {
  const findings: CopyFinding[] = [];
  collect(text, EM_DASH, "em-dash", findings);
  collect(text, EMOJI, "emoji", findings);
  collect(text, BANNED, "banned-phrase", findings);
  if (!options.allowPrices) collect(text, PRICE, "price-outside-offers", findings);
  return findings.sort((a, b) => a.line - b.line || a.column - b.column);
}

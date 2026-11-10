import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { tokens, type Theme } from "@/lib/design/tokens";

const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");

/** The custom properties declared in the first block that opens with `selector {`. */
function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  expect(start, `selector ${selector} in globals.css`).toBeGreaterThanOrEqual(0);
  const body = css.slice(start, css.indexOf("}", start));
  const vars: Record<string, string> = {};
  for (const [, name, value] of body.matchAll(/--([a-z-]+):\s*([^;]+);/g)) {
    vars[name] = value.trim().toUpperCase();
  }
  return vars;
}

function expected(theme: Theme) {
  return Object.fromEntries(
    Object.entries(tokens[theme]).map(([name, value]) => [name, value.toUpperCase()]),
  );
}

describe("globals.css theme tokens", () => {
  it("light values match lib/design/tokens.ts", () => {
    expect(block(".light")).toEqual(expected("light"));
  });

  it("dark values match lib/design/tokens.ts", () => {
    expect(block(".dark")).toEqual(expected("dark"));
  });

  it("the no-JavaScript dark fallback matches too", () => {
    expect(block(":root:not(.light)")).toEqual(expected("dark"));
  });

  it("sets color-scheme for each theme", () => {
    expect(css).toMatch(/\.light \{\s*color-scheme: light;/);
    expect(css).toMatch(/\.dark \{\s*color-scheme: dark;/);
  });
});

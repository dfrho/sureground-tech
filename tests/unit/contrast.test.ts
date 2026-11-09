import { describe, expect, it } from "vitest";

import { contrastRatio, meetsAA } from "@/lib/design/contrast";
import { palette, textPairs, tokens, type Theme } from "@/lib/design/tokens";

describe("contrastRatio", () => {
  it("matches the known extremes", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contrastRatio("#777777", "#777777")).toBeCloseTo(1, 5);
  });

  it("matches the measured brand pairs in CLAUDE.md", () => {
    expect(contrastRatio(palette.bone, palette.carbon)).toBeCloseTo(16.9, 0);
    expect(contrastRatio(palette.carbon, palette.signalBlue)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(palette.deepSignal, palette.bone)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(palette.signalBlue, palette.bone)).toBeLessThan(4.5);
  });
});

describe("theme tokens", () => {
  it("every declared text pair meets WCAG AA", () => {
    for (const pair of textPairs) {
      for (const theme of pair.themes ?? (Object.keys(tokens) as Theme[])) {
        const ratio = contrastRatio(tokens[theme][pair.fg], tokens[theme][pair.bg]);
        expect(meetsAA(ratio, pair.large), `${theme} ${pair.fg} on ${pair.bg}`).toBe(true);
      }
    }
  });

  it("never uses Signal Blue for light-mode text", () => {
    expect(tokens.light["accent-text"]).not.toBe(palette.signalBlue);
  });
});

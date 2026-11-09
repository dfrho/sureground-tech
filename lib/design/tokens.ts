/**
 * Theme color tokens, the source of truth for both themes. Phase 1 writes
 * these into app/globals.css as CSS variables; check:contrast reads them here.
 */

export const palette = {
  carbon: "#0E1116",
  graphite: "#1B2029",
  bone: "#F2F2EF",
  white: "#FFFFFF",
  steel: "#9AA3B2",
  iron: "#4A5261",
  rule: "#2A303A",
  ruleLight: "#D9DBD3",
  signalBlue: "#4C7DFF",
  deepSignal: "#2A55CC",
  volt: "#C6F36B",
} as const;

export type Theme = "dark" | "light";
export type TokenName =
  | "bg"
  | "surface"
  | "text"
  | "muted"
  | "border"
  | "accent-text"
  | "accent-fill"
  | "highlight"
  | "on-accent"
  | "on-highlight";

export const tokens: Record<Theme, Record<TokenName, string>> = {
  dark: {
    bg: palette.carbon,
    surface: palette.graphite,
    text: palette.bone,
    muted: palette.steel,
    border: palette.rule,
    "accent-text": palette.signalBlue,
    "accent-fill": palette.signalBlue,
    highlight: palette.volt,
    "on-accent": palette.carbon,
    "on-highlight": palette.carbon,
  },
  light: {
    bg: palette.bone,
    surface: palette.white,
    text: palette.carbon,
    muted: palette.iron,
    border: palette.ruleLight,
    "accent-text": palette.deepSignal,
    "accent-fill": palette.signalBlue,
    highlight: palette.volt,
    "on-accent": palette.carbon,
    "on-highlight": palette.carbon,
  },
};

/**
 * Every foreground and background pair the UI uses. `large` pairs are only
 * used for text at 24px and up (or 18.66px bold), so they need 3:1; all
 * others need 4.5:1 (WCAG 2.2 AA).
 */
export interface TextPair {
  fg: TokenName;
  bg: TokenName;
  large?: boolean;
  themes?: Theme[];
  note?: string;
}

export const textPairs: TextPair[] = [
  { fg: "text", bg: "bg" },
  { fg: "text", bg: "surface" },
  { fg: "muted", bg: "bg" },
  { fg: "muted", bg: "surface" },
  { fg: "accent-text", bg: "bg" },
  { fg: "accent-text", bg: "surface", themes: ["light"] },
  {
    fg: "accent-text",
    bg: "surface",
    themes: ["dark"],
    large: true,
    note: "Signal Blue on Graphite: large text only; use Bone for small text on cards",
  },
  { fg: "on-accent", bg: "accent-fill", note: "primary button label" },
  { fg: "on-highlight", bg: "highlight", note: "text on Volt" },
];

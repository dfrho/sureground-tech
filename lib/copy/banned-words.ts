/**
 * Pioneer and hype framing that never appears in shipped copy (guardrail 1).
 * Matched case-insensitively on word boundaries; hyphens and spaces are
 * interchangeable. `pnpm lint:copy` enforces this list.
 */
export const bannedPhrases = [
  "cutting-edge",
  "bleeding-edge",
  "first-of-its-kind",
  "frontier",
  "uncharted",
  "revolutionary",
  "revolutionize",
  "revolutionise",
  "game-changing",
  "game-changer",
  "unleash",
  "unleashes",
  "unleashed",
  "magic",
  "magical",
  "pioneering",
  "trailblazing",
  "groundbreaking",
  "don't get left behind",
  "dont get left behind",
  "left behind",
] as const;

import { describe, expect, it } from "vitest";

import { checkCopy } from "@/lib/copy/rules";

const rules = (text: string, allowPrices = false) =>
  checkCopy(text, { allowPrices }).map((f) => f.rule);

describe("checkCopy", () => {
  it("passes plain brand copy", () => {
    expect(rules("You don't have to be the pioneer. AI on sure ground.")).toEqual([]);
  });

  it("flags em dashes", () => {
    expect(rules("Proven ground \u2014 not guesses")).toEqual(["em-dash"]);
  });

  it("flags emojis but not digits, # or *", () => {
    expect(rules("Launch \u{1F680}")).toEqual(["emoji"]);
    expect(rules("Step 1 # 2 * 3")).toEqual([]);
  });

  it("flags banned phrases in any case and with hyphen or space", () => {
    expect(rules("Cutting edge AI")).toEqual(["banned-phrase"]);
    expect(rules("a game-changing tool")).toEqual(["banned-phrase"]);
    expect(rules("Don\u2019t get left behind")).toEqual(["banned-phrase"]);
    expect(rules("UNLEASH it")).toEqual(["banned-phrase"]);
  });

  it("matches whole words only", () => {
    expect(rules("imagine")).toEqual([]);
    expect(rules("the pioneer")).toEqual([]);
  });

  it("flags dollar amounts unless prices are allowed", () => {
    expect(rules("From $10,000")).toEqual(["price-outside-offers"]);
    expect(rules("From $ 750")).toEqual(["price-outside-offers"]);
    expect(rules("From $10,000", true)).toEqual([]);
    expect(rules("const a = `${b}`")).toEqual([]);
  });

  it("reports line and column", () => {
    const [finding] = checkCopy("ok\nso magic");
    expect(finding).toMatchObject({ line: 2, column: 4, match: "magic" });
  });
});

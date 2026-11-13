import { render } from "@react-email/render";
import { createElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  bands,
  companySizes,
  DIMENSION_MAX,
  dimensions,
  questions,
  READY_THRESHOLD,
  recommendations,
  roles,
  tieBreakOrder,
  TOTAL_MAX,
  type Dimension,
} from "@/content/scorecard";
import { ScorecardResult, scorecardResultText } from "@/emails/ScorecardResult";
import { offers } from "@/lib/config/offers";
import { fieldNames } from "@/lib/forms/contact-schema";
import { scorecardSchema } from "@/lib/forms/scorecard-schema";
import { present } from "@/lib/scorecard/present";
import { bandFor, observationKeys, score, type Answers } from "@/lib/scorecard/score";
import { buildCsp, integrationsForPath } from "@/lib/security/csp";

// The Server Action's collaborators: request headers, Turnstile and email.
const mocks = vi.hoisted(() => {
  process.env.CONTACT_TO_EMAIL = "david@sureground.tech";
  process.env.EMAIL_FROM = "SureGround <hello@send.sureground.tech>";
  process.env.EMAIL_TRANSPORT = "outbox";
  process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
  process.env.TURNSTILE_SECRET_KEY = "test-secret";
  return { sendEmail: vi.fn(), verifyTurnstile: vi.fn() };
});
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-real-ip": `10.0.0.${Math.floor(Math.random() * 250)}` }),
}));
vi.mock("@/lib/email/send", () => ({ sendEmail: mocks.sendEmail }));
vi.mock("@/lib/forms/turnstile", () => ({ verifyTurnstile: mocks.verifyTurnstile }));

/** Every question answered with the given answer id, or per dimension. */
function answersWith(pick: (dimension: Dimension, index: number) => string): Answers {
  const seen = new Map<Dimension, number>();
  return Object.fromEntries(
    questions.map((q) => {
      const i = seen.get(q.dimension) ?? 0;
      seen.set(q.dimension, i + 1);
      return [q.id, pick(q.dimension, i)];
    }),
  );
}
const all = (id: string) => answersWith(() => id);
/** Points 0 to 4 map to answer ids a to e. */
const idFor = (points: number) => "abcde"[points];
/** Sets one dimension's score (0 to 8) with every other dimension at `rest`. */
function withScores(scores: Partial<Record<Dimension, number>>, rest = 8): Answers {
  return answersWith((d, i) => {
    const s = scores[d] ?? rest;
    const first = Math.min(4, s);
    return idFor(i === 0 ? first : s - first);
  });
}

describe("scorecard content", () => {
  it("has 12 questions, two per dimension, each with answers worth 0 to 4 in order", () => {
    expect(questions).toHaveLength(12);
    for (const d of dimensions) {
      expect(questions.filter((q) => q.dimension === d)).toHaveLength(2);
    }
    for (const q of questions) {
      expect(q.answers.map((a) => a.points)).toEqual([0, 1, 2, 3, 4]);
      expect(new Set(q.answers.map((a) => a.id)).size).toBe(5);
    }
    expect(new Set(questions.map((q) => q.id)).size).toBe(12);
    expect(DIMENSION_MAX * dimensions.length).toBe(TOTAL_MAX);
  });

  it("has bands that cover 0 to 48 with no gaps or overlaps", () => {
    const sorted = [...bands].sort((a, b) => a.min - b.min);
    expect(sorted[0].min).toBe(0);
    expect(sorted.at(-1)!.max).toBe(TOTAL_MAX);
    for (let i = 1; i < sorted.length; i++) expect(sorted[i].min).toBe(sorted[i - 1].max + 1);
    expect(bands.map((b) => b.name)).toEqual([
      "Solid ground",
      "Firm footing",
      "Uneven ground",
      "Soft ground",
    ]);
  });

  it("recommends only real offers, and breaks ties over every dimension", () => {
    const slugs = new Set(offers.map((o) => o.slug));
    for (const d of dimensions) expect(slugs.has(recommendations[d].offer)).toBe(true);
    expect([...tieBreakOrder].sort()).toEqual([...dimensions].sort());
  });
});

describe("bandFor", () => {
  it.each([
    [0, "Soft ground"],
    [11, "Soft ground"],
    [12, "Uneven ground"],
    [23, "Uneven ground"],
    [24, "Firm footing"],
    [35, "Firm footing"],
    [36, "Solid ground"],
    [48, "Solid ground"],
  ])("puts %i in %s", (total, name) => {
    expect(bandFor(total).name).toBe(name);
  });

  it("rejects totals out of range", () => {
    for (const bad of [-1, 49, 1.5, Number.NaN]) expect(() => bandFor(bad)).toThrow(RangeError);
  });
});

describe("score", () => {
  it("scores the lowest and highest answers", () => {
    const low = score(all("a"));
    expect(low.total).toBe(0);
    expect(low.band.name).toBe("Soft ground");
    const high = score(all("e"));
    expect(high.total).toBe(48);
    expect(high.band.name).toBe("Solid ground");
    expect(high.dimensions.every((d) => d.score === 8 && d.max === 8)).toBe(true);
  });

  it("reaches every band boundary through real answers", () => {
    for (const total of [11, 12, 23, 24, 35, 36]) {
      // Fill points question by question until the total is reached.
      let left = total;
      const answers = Object.fromEntries(
        questions.map((q) => {
          const p = Math.min(4, left);
          left -= p;
          return [q.id, idFor(p)];
        }),
      );
      expect(score(answers).total).toBe(total);
      expect(score(answers).band).toBe(bandFor(total));
    }
  });

  it.each([
    ["safety", "safe-start"],
    ["goals", "opportunity-assessment"],
    ["workflows", "opportunity-assessment"],
    ["people", "ai-enablement"],
    ["data", "ai-engineering"],
    ["tools", "ai-engineering"],
  ] as const)("maps a weak %s score to %s", (dimension, offer) => {
    const result = score(withScores({ [dimension]: 0 }));
    expect(result.weakest).toBe(dimension);
    expect(result.recommendation.offer).toBe(offer);
    // Just under the ready threshold is still weak.
    expect(score(withScores({ [dimension]: READY_THRESHOLD - 1 })).recommendation.offer).toBe(
      offer,
    );
  });

  it("recommends a pilot when every dimension is at the ready threshold", () => {
    const result = score(withScores({}, READY_THRESHOLD));
    expect(result.weakest).toBeNull();
    expect(result.recommendation.offer).toBe("pilot-sprint");
  });

  it("breaks ties for the weakest dimension in the documented order", () => {
    expect(score(all("c")).weakest).toBe("safety");
    expect(score(withScores({ data: 2, tools: 2 })).weakest).toBe("data");
    expect(score(withScores({ people: 3, goals: 3 })).weakest).toBe("goals");
  });

  it("rejects missing or unknown answers", () => {
    const answers = all("c");
    expect(() => score({ ...answers, "goals-1": "z" })).toThrow();
    const { ["tools-2"]: _omit, ...missing } = answers;
    void _omit;
    expect(() => score(missing as Answers)).toThrow();
  });

  it("gives one to three observations: up to two weak areas and one strength", () => {
    expect(observationKeys(score(all("a")).dimensions)).toEqual([
      { dimension: "safety", kind: "weak" },
      { dimension: "goals", kind: "weak" },
    ]);
    expect(observationKeys(score(all("e")).dimensions)).toEqual([
      { dimension: "safety", kind: "strong" },
    ]);
    const mixed = observationKeys(score(withScores({ data: 1, tools: 3, people: 7 })).dimensions);
    expect(mixed).toEqual([
      { dimension: "data", kind: "weak" },
      { dimension: "tools", kind: "weak" },
      { dimension: "safety", kind: "strong" },
    ]);
  });

  it("presents the price from offers.ts", () => {
    const outcome = present(score(withScores({ safety: 0 })));
    expect(outcome.recommendation.name).toBe("AI Safe Start");
    expect(outcome.recommendation.price).toMatch(/^Starting at \$[\d,]+$/);
    expect(outcome.recommendation.href).toBe("/services/safe-start");
    expect(outcome.dimensions.map((d) => d.label)).toEqual([
      "Goals",
      "Workflows",
      "Data",
      "People",
      "Safety",
      "Tools",
    ]);
  });
});

const gate = {
  firstName: "Pat",
  email: "pat@example.com",
  company: "Example Co",
  size: companySizes[1],
  role: roles[0],
  consent: "yes",
};

describe("scorecard schema", () => {
  it("accepts a complete submission", () => {
    expect(scorecardSchema.safeParse({ ...all("c"), ...gate }).success).toBe(true);
  });

  it("rejects unknown answers, a missing answer, missing consent and bad enums", () => {
    const fail = (input: Record<string, unknown>, path: string) => {
      const r = scorecardSchema.safeParse(input);
      expect(r.success).toBe(false);
      expect(r.error!.issues.map((i) => i.path[0])).toContain(path);
    };
    fail({ ...all("c"), ...gate, "data-1": "4" }, "data-1");
    fail({ ...all("c"), ...gate, "data-1": undefined }, "data-1");
    fail({ ...all("c"), ...gate, consent: undefined }, "consent");
    fail({ ...all("c"), ...gate, consent: "on" }, "consent");
    fail({ ...all("c"), ...gate, size: "Huge" }, "size");
    fail({ ...all("c"), ...gate, role: "CTO" }, "role");
    fail({ ...all("c"), ...gate, email: "pat@example" }, "email");
    fail({ ...all("c"), ...gate, firstName: "x".repeat(81) }, "firstName");
  });
});

describe("scorecard result email", () => {
  it("holds only fixed text and the score", async () => {
    const outcome = present(score(all("b")));
    const html = await render(createElement(ScorecardResult, { outcome }));
    const text = scorecardResultText(outcome);
    for (const body of [html, text]) {
      expect(body).toContain(outcome.band.name);
      expect(body).toContain(`${outcome.total}`);
      expect(body).toContain(outcome.recommendation.name);
      expect(body).not.toMatch(/—/);
    }
    expect(html).not.toMatch(/<img/i);
  });
});

describe("CSP for the scorecard", () => {
  it("allows Turnstile but not Cal.com or inline styles", () => {
    const nonce = "AAAAAAAAAAAAAAAAAAAAAA==";
    expect(integrationsForPath("/scorecard")).toEqual(["turnstile"]);
    const csp = buildCsp({ nonce, integrations: integrationsForPath("/scorecard") });
    expect(csp).toContain("frame-src https://challenges.cloudflare.com");
    expect(csp).not.toContain("cal.com");
    expect(csp).toContain(`style-src 'self' 'nonce-${nonce}'`);
  });
});

describe("submitScorecard", () => {
  const formData = (overrides: Record<string, string> = {}) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries({
      ...all("b"),
      ...gate,
      firstName: "Mallory <b>Visit evil.example</b>",
      company: "Buy now at evil.example",
      [fieldNames.turnstile]: "token",
      ...overrides,
    })) {
      fd.set(k, v);
    }
    return fd;
  };

  beforeEach(() => {
    mocks.sendEmail.mockReset().mockResolvedValue(true);
    mocks.verifyTurnstile.mockReset().mockResolvedValue({ ok: true });
  });

  it("recomputes the score on the server and never echoes visitor text to the visitor", async () => {
    const { submitScorecard } = await import("@/app/actions/scorecard");
    // A client-sent score is ignored: only answer ids count.
    const state = await submitScorecard(
      { status: "idle" },
      formData({ total: "48", score: "48", band: "Solid ground" }),
    );
    expect(state.status).toBe("success");
    if (state.status !== "success") return;
    expect(state.outcome.total).toBe(12);
    expect(state.outcome.band.name).toBe("Uneven ground");

    expect(mocks.sendEmail).toHaveBeenCalledTimes(2);
    const [lead, result] = mocks.sendEmail.mock.calls.map((c) => c[0]);
    expect(lead.to).toBe("david@sureground.tech");
    expect(lead.replyTo).toBe("pat@example.com");
    expect(result.to).toBe("pat@example.com");
    expect(result.replyTo).toBe("david@sureground.tech");
    const html = await render(result.react);
    for (const body of [html, result.text, result.subject]) {
      expect(body).not.toContain("Mallory");
      expect(body).not.toContain("evil.example");
    }
    // David's copy has the submitted fields, escaped.
    const leadHtml = await render(lead.react);
    expect(leadHtml).toContain("Mallory &lt;b&gt;");
    expect(leadHtml).not.toContain("<b>Visit");
  });

  it("never claims success when an email fails", async () => {
    const { submitScorecard } = await import("@/app/actions/scorecard");
    mocks.sendEmail.mockResolvedValueOnce(false);
    const leadFailed = await submitScorecard({ status: "idle" }, formData());
    expect(leadFailed.status).toBe("error");
    expect(mocks.sendEmail).toHaveBeenCalledTimes(1);

    mocks.sendEmail.mockReset().mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const resultFailed = await submitScorecard({ status: "idle" }, formData());
    expect(resultFailed.status).toBe("error");
  });

  it("fails closed on Turnstile, the honeypot and bad answers", async () => {
    const { submitScorecard } = await import("@/app/actions/scorecard");
    mocks.verifyTurnstile.mockResolvedValueOnce({ ok: false, reason: "rejected" });
    expect((await submitScorecard({ status: "idle" }, formData())).status).toBe("error");
    expect(
      (await submitScorecard({ status: "idle" }, formData({ [fieldNames.honeypot]: "x" }))).status,
    ).toBe("error");
    const bad = await submitScorecard({ status: "idle" }, formData({ "safety-2": "e; drop" }));
    expect(bad.status).toBe("error");
    if (bad.status === "error") expect(bad.fieldErrors).toHaveProperty("safety-2");
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("limits each email address to three results a day", async () => {
    const { submitScorecard } = await import("@/app/actions/scorecard");
    const email = "limit@example.com";
    for (let i = 0; i < 3; i++) {
      expect((await submitScorecard({ status: "idle" }, formData({ email }))).status).toBe(
        "success",
      );
    }
    const blocked = await submitScorecard({ status: "idle" }, formData({ email }));
    expect(blocked.status).toBe("error");
    if (blocked.status === "error") expect(blocked.message).toMatch(/Too many tries/);
  });
});

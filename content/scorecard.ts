import type { OfferSlug } from "@/lib/config/offers";

/**
 * First Step Scorecard content: questions, answer points, bands, observations
 * and recommendations. Scoring itself lives in lib/scorecard/score.ts.
 *
 * COPY: draft. Every question, answer, band, observation and recommendation
 * here waits for David's approval (docs/copy-review.md, Phase 5).
 *
 * Rules: 12 questions, two per dimension, five answers each worth 0 to 4
 * points, listed from 0 to 4. Answer ids are what the form posts; the server
 * looks up the points, so a client can never send its own score.
 */

export const dimensions = ["goals", "workflows", "data", "people", "safety", "tools"] as const;
export type Dimension = (typeof dimensions)[number];

export interface DimensionInfo {
  label: string;
  /** Shown when this is one of the weakest areas. */
  weak: string;
  /** Shown when this is the strongest area and it scores well. */
  strong: string;
}

export const dimensionInfo: Record<Dimension, DimensionInfo> = {
  goals: {
    label: "Goals",
    weak: "Goals: it is not yet clear which problems AI should solve. Without that, any tool looks like an answer, and it is hard to tell whether a project worked.",
    strong:
      "Goals: you know which problems you want AI to solve and how you would measure success. That is the part most owners skip.",
  },
  workflows: {
    label: "Workflows",
    weak: "Workflows: much of the work lives in people's heads. AI can only follow a process that is written down, so that comes first.",
    strong:
      "Workflows: your processes are written down and repeatable, which makes them good candidates for AI help.",
  },
  data: {
    label: "Data",
    weak: "Data: the information AI would need is scattered or hard to trust. AI grounded in messy records gives confident, wrong answers.",
    strong:
      "Data: your records are organized and trusted, so AI can be grounded in facts you already stand behind.",
  },
  people: {
    label: "People",
    weak: "People: your team has little time or experience with AI. Tools that nobody has time to learn do not get used.",
    strong:
      "People: your team already uses AI and has time to take on a project, which is what makes new tools stick.",
  },
  safety: {
    label: "Safety",
    weak: "Safety: there are no clear rules on which AI tools staff may use or what they may share. Staff are likely using AI already, without guardrails.",
    strong:
      "Safety: you have clear rules for AI tools and data, so new projects start from a safe baseline.",
  },
  tools: {
    label: "Tools",
    weak: "Tools: people re-key information between systems. That is slow and error-prone, and it is often the best first place for AI and automation.",
    strong:
      "Tools: your main systems already share data, so AI can plug in without a pile of manual steps.",
  },
};

export interface Answer {
  id: string;
  label: string;
  points: 0 | 1 | 2 | 3 | 4;
}

export interface Question {
  id: string;
  dimension: Dimension;
  prompt: string;
  answers: readonly [Answer, Answer, Answer, Answer, Answer];
}

/** Five answers worth 0 to 4, in order. Ids are a to e. */
function answers(labels: readonly [string, string, string, string, string]): Question["answers"] {
  const ids = ["a", "b", "c", "d", "e"] as const;
  return labels.map((label, i) => ({
    id: ids[i],
    label,
    points: i as Answer["points"],
  })) as unknown as Question["answers"];
}

export const questions: readonly Question[] = [
  {
    id: "goals-1",
    dimension: "goals",
    prompt: "Which best describes where AI fits in your business today?",
    answers: answers([
      "We have not thought about it yet.",
      "We know we should look at it, but not where.",
      "We have a few ideas, none written down.",
      "We have a short list of problems AI might solve.",
      "We have specific problems picked out, each with an owner and a reason it matters.",
    ]),
  },
  {
    id: "goals-2",
    dimension: "goals",
    prompt: "How would you tell whether an AI project worked?",
    answers: answers([
      "We would not know how to tell.",
      "We would go on gut feel.",
      "We would look at cost, roughly.",
      "We would track one or two numbers, like hours saved or response time.",
      "We know today's baseline and the number we want to move.",
    ]),
  },
  {
    id: "workflows-1",
    dimension: "workflows",
    prompt: "How are your most repetitive tasks done today?",
    answers: answers([
      "Everyone does them their own way.",
      "A few people know the steps, and the steps live in their heads.",
      "There are some notes, but they are out of date.",
      "Most steps are written down and mostly followed.",
      "They are written down, followed, and updated when something changes.",
    ]),
  },
  {
    id: "workflows-2",
    dimension: "workflows",
    prompt: "When a key person is out for a week, what happens to their work?",
    answers: answers([
      "It stops until they are back.",
      "Someone guesses and fixes it later.",
      "Someone covers it, with a lot of questions.",
      "Someone covers it from notes, with a few questions.",
      "Anyone trained can pick it up from the written process.",
    ]),
  },
  {
    id: "data-1",
    dimension: "data",
    prompt: "Where does the information your team relies on live?",
    answers: answers([
      "Mostly in email and in people's heads.",
      "Spread across personal drives and spreadsheets.",
      "In a few shared places, but hard to search.",
      "In shared systems most people can find their way around.",
      "In organized systems with clear owners and access rules.",
    ]),
  },
  {
    id: "data-2",
    dimension: "data",
    prompt: "How much do you trust your core records, like customers, orders or cases?",
    answers: answers([
      "Not much. We know there are gaps and duplicates.",
      "Somewhat. We fix errors as we run into them.",
      "Mostly. Some fields are reliable and others are not.",
      "Well. Someone keeps them clean, with occasional gaps.",
      "Fully. We would base a major decision on them.",
    ]),
  },
  {
    id: "people-1",
    dimension: "people",
    prompt: "How does your team use AI tools today?",
    answers: answers([
      "Nobody does, as far as we know.",
      "A few people try them on their own.",
      "Several people use them, with no shared approach.",
      "Most people use them for some everyday tasks.",
      "The team uses them regularly and shares what works.",
    ]),
  },
  {
    id: "people-2",
    dimension: "people",
    prompt: "Could your team give a new project a few hours a week for a month?",
    answers: answers([
      "No. Everyone is already stretched.",
      "Only after hours.",
      "Maybe one person, some weeks.",
      "Yes, one or two people could.",
      "Yes, and we would name an owner for it.",
    ]),
  },
  {
    id: "safety-1",
    dimension: "safety",
    prompt: "Do you have a written policy on which AI tools staff may use?",
    answers: answers([
      "No, and we are not sure what is in use.",
      "No, but we know roughly what people use.",
      "We have talked about it, but nothing is written.",
      "We have a written policy, not yet shared with everyone.",
      "Yes. It is written, shared and followed.",
    ]),
  },
  {
    id: "safety-2",
    dimension: "safety",
    prompt: "Does your team know what information must never go into an AI tool?",
    answers: answers([
      "We have never discussed it.",
      "People use their own judgment.",
      "Leaders know, but the team may not.",
      "Most people know the basics.",
      "Everyone knows, it is written down, and new hires learn it.",
    ]),
  },
  {
    id: "tools-1",
    dimension: "tools",
    prompt: "How often does someone re-type information from one system into another?",
    answers: answers([
      "Every day, for most of our work.",
      "Every day, for some tasks.",
      "A few times a week.",
      "Rarely. A few key systems are connected.",
      "Almost never. Our main systems share data.",
    ]),
  },
  {
    id: "tools-2",
    dimension: "tools",
    prompt: "If you wanted to connect a new tool to your main systems, how would it go?",
    answers: answers([
      "We do not know what our systems can connect to.",
      "We would need outside help just to find out.",
      "It is possible, but each connection is a project.",
      "We have connected tools before and could again.",
      "Someone owns our integrations and knows the options.",
    ]),
  },
];

export type QuestionId = (typeof questions)[number]["id"];

/** Points per dimension: two questions of up to 4 points each. */
export const DIMENSION_MAX = 8;
/** Total: 12 questions of up to 4 points each. */
export const TOTAL_MAX = 48;

export const bandIds = ["solid", "firm", "uneven", "soft"] as const;
export type BandId = (typeof bandIds)[number];

export interface Band {
  id: BandId;
  name: string;
  /** Lowest total in this band, inclusive. Bands are checked from the top. */
  min: number;
  max: number;
  summary: string;
}

export const bands: readonly Band[] = [
  {
    id: "solid",
    name: "Solid ground",
    min: 36,
    max: 48,
    summary:
      "The basics are in place. You are ready to put AI to work on one real workflow, with a clear way to measure it.",
  },
  {
    id: "firm",
    name: "Firm footing",
    min: 24,
    max: 35,
    summary:
      "Most of the foundation is there. Shore up the weakest area below and a first project has a good chance of paying off.",
  },
  {
    id: "uneven",
    name: "Uneven ground",
    min: 12,
    max: 23,
    summary:
      "Some pieces are in place and some are not. A small, careful first step will show you where to build before you spend on a project.",
  },
  {
    id: "soft",
    name: "Soft ground",
    min: 0,
    max: 11,
    summary:
      "You are early, and that is a fine place to start. Put the basics in place first so your first AI project does not sink.",
  },
];

export interface Recommendation {
  offer: OfferSlug;
  /** Why this offer is the first step, in plain language. */
  reason: string;
}

/** The weakest dimension decides the recommended first step. */
export const recommendations: Record<Dimension, Recommendation> = {
  safety: {
    offer: "safe-start",
    reason:
      "Your weakest area is safety. Start by finding the AI already in use and putting clear rules in place, before anything new is added.",
  },
  goals: {
    offer: "opportunity-assessment",
    reason:
      "Your weakest area is goals. Start by mapping where AI would save real time and money, so the first project is the right one.",
  },
  workflows: {
    offer: "opportunity-assessment",
    reason:
      "Your weakest area is workflows. Start by mapping how the work gets done today, then pick the workflow where AI helps most.",
  },
  people: {
    offer: "ai-enablement",
    reason:
      "Your weakest area is people. Start by giving your team the skills and the rules to use AI well, so new tools get used.",
  },
  data: {
    offer: "opportunity-assessment",
    reason:
      "Your weakest area is data. Start by finding which information your best AI uses depend on, and what it takes to get it in shape.",
  },
  tools: {
    offer: "opportunity-assessment",
    reason:
      "Your weakest area is tools. Start by finding where people re-key data between systems and which connections would save the most time.",
  },
};

/**
 * When every dimension scores at least this much, there is no weak spot to
 * fix first, and the recommendation is a pilot.
 */
export const READY_THRESHOLD = 6;

export const readyRecommendation: Recommendation = {
  offer: "pilot-sprint",
  reason:
    "Every area scored well. You are ready to put AI to work on one back-office workflow, on proven tools, with a clear way to measure it.",
};

/**
 * Who would build and run an AI project today. Asked on the email gate and
 * not scored: an in-house team does not make the ground more solid, but it
 * changes which offer fits. David approved the options on 2026-11-13.
 */
export const teamQuestion = "Who would build and run an AI project for you today?";

export const teams = [
  "No one in-house",
  "An outside IT provider",
  "One or two IT or technical staff",
  "An engineering team with little AI experience",
  "An engineering team that already builds with AI",
] as const;
export type Team = (typeof teams)[number];

export interface TeamOverride {
  /** Build offers this team does not need from us. */
  replaces: readonly OfferSlug[];
  recommendation: Recommendation;
}

/**
 * Teams that can build for themselves get a different first step in place of
 * a build offer. Every other recommendation stands.
 */
export const teamOverrides: Partial<Record<Team, TeamOverride>> = {
  "An engineering team with little AI experience": {
    replaces: ["ai-engineering", "pilot-sprint"],
    recommendation: {
      offer: "fractional-se",
      reason:
        "You have engineers who can build, so the gap is AI experience. A part-time AI lead sets the roadmap, picks proven tools and works alongside your team on the first build.",
    },
  },
  "An engineering team that already builds with AI": {
    replaces: ["ai-engineering", "pilot-sprint"],
    recommendation: {
      offer: "pilot-triage",
      reason:
        "Your team already builds with AI, so another builder is rarely the missing piece. If a project has stalled, an outside review names the blocker and a fixed-price next step.",
    },
  },
};

/**
 * Ties for the weakest dimension go to the first one in this order: risk
 * first, then the steps that cost least to start.
 */
export const tieBreakOrder: readonly Dimension[] = [
  "safety",
  "goals",
  "people",
  "workflows",
  "data",
  "tools",
];

export const disclaimer =
  "This is a self-assessment based on your own answers, not an audit. It is a starting point for a conversation, not a verdict.";

// Email gate options.
export const companySizes = [
  "1 to 9 people",
  "10 to 49 people",
  "50 to 99 people",
  "100 to 250 people",
  "More than 250 people",
] as const;

export const roles = [
  "Owner or founder",
  "CEO or president",
  "Operations leader",
  "Finance leader",
  "Technology leader",
  "Other",
] as const;

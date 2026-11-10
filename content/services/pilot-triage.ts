import type { ServiceContent } from "./types";

export const pilotTriage: ServiceContent = {
  slug: "pilot-triage",
  headline: "A straight verdict on the AI project that stalled.",
  intro:
    "We look at up to two stuck AI projects and tell you whether to go, kill or fix each one, and what is blocking it.",
  whoFor: [
    "Businesses with an AI pilot that never reached production",
    "Owners who have paid for AI work and can't tell if it's close",
    "Teams arguing about whether to keep going",
  ],
  problem:
    "Stalled AI projects rarely fail on the model. They fail on data that isn't ready, an integration nobody owns, or a team that doesn't trust the output. Until someone names the blocker, money keeps going in.",
  steps: [
    {
      title: "Review the work",
      body: "We read the code, the data and the decisions made so far.",
    },
    {
      title: "Name the blocker",
      body: "We identify the data or integration problem holding each project back.",
    },
    {
      title: "Give a verdict",
      body: "Go, kill or fix, with the reasons in writing.",
    },
    {
      title: "Price the next step",
      body: "If it's worth fixing, you get a fixed-price next step.",
    },
  ],
  proof: ["shogun-troubleshooting", "fullstory-ai-summary"],
  faq: [
    {
      q: "What if you can't find a blocker?",
      a: "Then the fee comes back to you. The exact terms are listed above.",
    },
    {
      q: "Do we have to hire you to fix it?",
      a: "No. The verdict and the named blocker are yours to act on however you choose.",
    },
  ],
  related: ["pilot-sprint", "opportunity-assessment"],
};

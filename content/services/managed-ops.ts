import type { ServiceContent } from "./types";

export const managedOps: ServiceContent = {
  slug: "managed-ops",
  headline: "We keep your AI systems working after launch.",
  intro:
    "Monitoring, maintenance and a monthly block of improvements, with a plain-language report each month.",
  whoFor: [
    "Businesses with an AI workflow in production and no one to look after it",
    "Teams that finished a Pilot Sprint and want it to keep improving",
  ],
  problem:
    "AI systems drift. Tools change their models, data changes shape, and small errors creep in. Without someone watching, a working system can quietly get worse until people stop trusting it.",
  steps: [
    {
      title: "Monitor",
      body: "We watch accuracy, failures and costs.",
    },
    {
      title: "Maintain",
      body: "We handle tool updates, model changes and broken connections.",
    },
    {
      title: "Improve",
      body: "Each month includes a block of improvements you choose.",
    },
    {
      title: "Report",
      body: "A plain-language monthly report on what changed and what it saved.",
    },
  ],
  proof: ["shogun-troubleshooting"],
  faq: [
    {
      q: "Is there a long contract?",
      a: "No. The terms are listed above.",
    },
    {
      q: "Can you look after a system someone else built?",
      a: "Often, yes. We review it first so we know what we are taking on.",
    },
  ],
  related: ["pilot-sprint", "fractional-se"],
};

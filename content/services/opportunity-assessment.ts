import type { ServiceContent } from "./types";

export const opportunityAssessment: ServiceContent = {
  slug: "opportunity-assessment",
  headline: "Know which AI projects are worth it before you spend on one.",
  intro:
    "We map how your work gets done, measure where the hours go, and rank the opportunities by cost and return.",
  whoFor: [
    "Owners who hear about AI everywhere but can't see where it fits",
    "Leadership teams that need numbers before they approve a project",
    "Businesses choosing between buying a tool and building something",
  ],
  problem:
    "When owners push back on AI, the real objection is usually unclear return, not price. A guess is a poor basis for a project. A measured baseline and a ranked list turn the decision into arithmetic.",
  steps: [
    {
      title: "Map the workflows",
      body: "We walk through the processes that take your team the most time.",
    },
    {
      title: "Measure the baseline",
      body: "We record the hours each one takes today, so later results have something to compare against.",
    },
    {
      title: "Rank the opportunities",
      body: "Each opportunity gets a cost, an expected return and a buy-versus-build recommendation.",
    },
    {
      title: "Plan the roadmap",
      body: "You get a roadmap you can run with us, with another firm or on your own.",
    },
  ],
  proof: ["security-reviews", "autozone-speed"],
  faq: [
    {
      q: "Do we have to build what you recommend?",
      a: "No. The roadmap is yours. Many recommendations are tools to buy, not software to build.",
    },
    {
      q: "What do you need from us?",
      a: "Time with the people who do the work, and access to the systems they use.",
    },
  ],
  related: ["pilot-sprint", "fit-call", "safe-start"],
};

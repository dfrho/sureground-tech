import type { ServiceContent } from "./types";

export const answerEngine: ServiceContent = {
  slug: "answer-engine",
  headline: "Answer security questionnaires and RFPs without starting from scratch.",
  intro:
    "We build a curated library of approved answers, including the new AI-governance questions buyers ask, and set up a tool to draft from it.",
  whoFor: [
    "B2B sellers who lose days to every security questionnaire",
    "Teams that answer the same RFP questions in different words each time",
    "Vendors now being asked how they govern AI",
  ],
  problem:
    "Buyers send longer security questionnaires every year, and many now ask how you use and govern AI. The answers live in old documents and in a few people's heads. Each one gets rewritten, and inconsistent answers can stall a deal in review.",
  steps: [
    {
      title: "Gather the answers",
      body: "We collect your past questionnaires, policies and RFP responses.",
    },
    {
      title: "Curate the library",
      body: "We turn them into one set of approved answers, including AI governance.",
    },
    {
      title: "Set up the tool",
      body: "We select and configure a tool that drafts new responses from the library for a person to review.",
    },
    {
      title: "Keep it current",
      body: "A refresh process so answers stay accurate as your policies change.",
    },
  ],
  proof: ["security-reviews"],
  faq: [
    {
      q: "Does AI send answers to buyers?",
      a: "No. It drafts from your approved library, and a person reviews every response before it goes out.",
    },
    {
      q: "Who keeps the library up to date?",
      a: "Your team, with the refresh process we set up, or us through the optional upkeep listed above.",
    },
  ],
  related: ["safe-start", "fractional-se", "demo-site-build"],
};

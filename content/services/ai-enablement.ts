import type { ServiceContent } from "./types";

export const aiEnablement: ServiceContent = {
  slug: "ai-enablement",
  headline: "Training built on your tools and your work.",
  intro:
    "Your team learns to use AI safely on the tasks they actually do, with the tools you have approved.",
  whoFor: [
    "Teams already using AI on their own, without shared rules",
    "Leaders who need a clear briefing before they set policy",
    "Businesses rolling out a new AI tool to staff",
  ],
  problem:
    "Generic AI courses are free and everywhere. What teams lack is training on their own documents, their own tools and their own rules: what to paste, what never to paste, and how to check an answer before it goes to a customer.",
  steps: [
    {
      title: "Brief the leaders",
      body: "An executive briefing on what AI can and should not do in your business.",
    },
    {
      title: "Run the workshops",
      body: "Hands-on sessions on real tasks from each team, using your approved tools.",
    },
    {
      title: "Leave playbooks behind",
      body: "Role-based playbooks and an approved-tools guide your team can keep using.",
    },
    {
      title: "Hold office hours",
      body: "Time for questions once people start using what they learned.",
    },
  ],
  proof: ["security-reviews", "fullstory-ai-summary"],
  faq: [
    {
      q: "Is this a generic AI course?",
      a: "No. Every session is built on your tools, your documents and your policies.",
    },
    {
      q: "Do we need a policy first?",
      a: "It helps. If you don't have one, AI Safe Start produces an acceptable-use policy and approved-tools list that the training then teaches.",
    },
  ],
  related: ["safe-start", "fit-call", "fractional-se"],
};

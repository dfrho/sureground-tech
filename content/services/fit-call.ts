import type { ServiceContent } from "./types";

export const fitCall: ServiceContent = {
  slug: "fit-call",
  headline: "A short call and a written plan.",
  intro:
    "Tell us how your business runs. We send back a one-page plan with two or three places AI could help, whether or not you hire us.",
  whoFor: [
    "Owners who want a straight answer on where AI fits",
    "Teams deciding whether to start with policy, an assessment or a build",
  ],
  problem:
    "It's hard to know where to start when every vendor says their tool is the answer. A short conversation with someone who has no tool to sell you is often enough to find the first sensible step.",
  steps: [
    {
      title: "Book a time",
      body: "Pick a slot that suits you. No preparation needed.",
    },
    {
      title: "Talk it through",
      body: "We ask about your workflows, your tools and what worries you about AI.",
    },
    {
      title: "Get your plan",
      body: "You receive a one-page plan with two or three candidate uses and a suggested first step.",
    },
  ],
  proof: ["security-reviews"],
  faq: [
    {
      q: "Is this a sales call?",
      a: "It's a working call. You leave with a written plan you can use with or without us.",
    },
    {
      q: "What should I bring?",
      a: "Nothing formal. A rough idea of the tasks that take your team the most time is enough.",
    },
  ],
  related: ["safe-start", "opportunity-assessment"],
};

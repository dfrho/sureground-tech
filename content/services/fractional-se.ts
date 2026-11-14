import type { ServiceContent } from "./types";

export const fractionalSe: ServiceContent = {
  slug: "fractional-se",
  headline: "A hands-on AI lead, part time.",
  intro:
    "Someone senior to own your AI roadmap, approve vendors, answer customer security questions and build, without a full-time hire.",
  whoFor: [
    "Businesses that need AI leadership but not a full-time executive",
    "B2B sellers whose customers ask hard questions about AI and security",
    "Teams running several AI projects with no one coordinating them",
  ],
  problem:
    "Owners say they lack the technical expertise to choose tools and take AI further. A full-time AI leader is expensive and hard to find. A part-time one who has sat across the table from security teams can cover the roadmap, the reviews and the build work.",
  steps: [
    {
      title: "Set the roadmap",
      body: "We agree priorities and keep the roadmap current.",
    },
    {
      title: "Approve vendors",
      body: "We review AI tools before you buy them and keep governance up to date.",
    },
    {
      title: "Answer customers",
      body: "We handle customer security and AI questions with your sales team.",
    },
    {
      title: "Build",
      body: "One build slot is included for hands-on work.",
    },
  ],
  proof: ["security-reviews", "fullstory-ai-summary", "autozone-speed"],
  faq: [
    {
      q: "How much time do we get?",
      a: "We agree a schedule and response times at the start, sized to your roadmap.",
    },
    {
      q: "Is there a minimum term?",
      a: "Yes. It is listed above.",
    },
  ],
  related: ["answer-engine", "demo-site-build", "managed-ops"],
};

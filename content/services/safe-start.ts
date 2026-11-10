import type { ServiceContent } from "./types";

export const safeStart: ServiceContent = {
  slug: "safe-start",
  headline: "Find the AI already in your business, then set the rules.",
  intro:
    "Your staff are probably using AI tools you haven't approved. We find them, rate the risk, and give you a policy people can follow.",
  whoFor: [
    "Owners who suspect staff paste company data into public chat tools",
    "Businesses facing customer security questionnaires that ask about AI",
    "Teams that want to use AI more but need rules first",
  ],
  problem:
    "Data security and privacy are the top reasons owners hold back on AI. Meanwhile, unapproved tools are already in use in many businesses. You can't manage risk you haven't found, and a ban nobody follows protects no one.",
  steps: [
    {
      title: "Inventory",
      body: "We find the AI tools in use across your business, approved or not.",
    },
    {
      title: "Rate the risk",
      body: "Each tool gets a plain risk rating based on what data it sees and where that data goes.",
    },
    {
      title: "Write the policy",
      body: "You get an acceptable-use policy and an approved-tools list written for staff, not lawyers.",
    },
    {
      title: "Check new vendors",
      body: "An AI vendor checklist for the next tool someone wants to buy.",
    },
  ],
  proof: ["security-reviews"],
  faq: [
    {
      q: "Will this slow my team down?",
      a: "The goal is the opposite: a short approved list means people can use AI without asking every time.",
    },
    {
      q: "Is this legal advice?",
      a: "No. The policy is a practical starting point. Have your lawyer review it for your situation.",
    },
  ],
  related: ["ai-enablement", "opportunity-assessment", "answer-engine"],
};

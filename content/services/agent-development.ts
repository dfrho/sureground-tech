import type { ServiceContent } from "./types";

export const agentDevelopment: ServiceContent = {
  slug: "agent-development",
  headline: "Task agents that ask before they act.",
  intro:
    "We build agents for back-office work, with a person approving each step that matters. They draft, research and reconcile; your team decides.",
  whoFor: [
    "Teams buried in intake forms, order changes or ticket routing",
    "Owners who want help with repetitive research and drafting",
    "Operations leads who need every automated step to be reviewable",
  ],
  problem:
    "Most owners don't trust AI to run even low-level tasks on its own, and they're right to be careful. An agent that acts without review can send the wrong email or post the wrong number. The fix is design, not hope: clear approval points, narrow permissions and a record of what the agent did.",
  steps: [
    {
      title: "Map the task",
      body: "We write down every step, input and decision in the task as it runs today.",
    },
    {
      title: "Set approval points",
      body: "We decide with you where a person must approve before the agent continues.",
    },
    {
      title: "Build and test",
      body: "We build the agent on proven tools and test it against your real cases, including the awkward ones.",
    },
    {
      title: "Launch with your team",
      body: "Your team learns to review its work, and you get a written data-handling note.",
    },
  ],
  proof: ["fullstory-ai-summary", "security-reviews"],
  faq: [
    {
      q: "Can the agent act on its own?",
      a: "Only where you decide it can. By default, anything that leaves the building or changes a record waits for a person.",
    },
    {
      q: "What kind of work fits?",
      a: "Intake, research, drafting, reconciliation, and order and ticket handling: repeatable back-office work where a reviewer can check the output quickly.",
    },
    {
      q: "How is it sold?",
      a: "As a Proven-Pattern Pilot Sprint, or added to one.",
    },
  ],
  related: ["pilot-sprint", "ai-engineering", "managed-ops"],
};

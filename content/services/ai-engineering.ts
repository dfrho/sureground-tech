import type { ServiceContent } from "./types";

export const aiEngineering: ServiceContent = {
  slug: "ai-engineering",
  headline: "AI built into the work your team already does.",
  intro:
    "We connect proven AI tools to your systems and your documents, test them for accuracy, and hand you something your team can run.",
  whoFor: [
    "Owners whose team re-keys the same data between systems every week",
    "Teams that answer the same questions from scattered documents",
    "Businesses that tried a chat subscription and want it wired into real work",
  ],
  problem:
    "Most businesses already pay for an AI chat tool. Few have it connected to the systems and documents that hold their real work, so it stays a side project. The value is in the plumbing: getting the right information to the model, checking its answers, and putting a person in the loop where a mistake would cost you.",
  steps: [
    {
      title: "Pick one workflow",
      body: "We choose one back-office process with a clear owner and a measurable baseline.",
    },
    {
      title: "Connect your data",
      body: "We connect the tools you already use and ground answers in your own documents.",
    },
    {
      title: "Test before launch",
      body: "We run evaluations against real examples so you see the accuracy before your team relies on it.",
    },
    {
      title: "Train and hand over",
      body: "Your team learns to run it, and you get a written note on what data goes where.",
    },
  ],
  proof: ["autozone-speed", "fullstory-ai-summary"],
  faq: [
    {
      q: "Do we have to buy new software?",
      a: "Usually not. We start with the tools you already pay for and write custom code only for the thin layer that connects them to your data.",
    },
    {
      q: "Where does our data go?",
      a: "Every build ships with a written data-handling note that lists each tool, what it sees and where it stores data.",
    },
    {
      q: "How is it sold?",
      a: "As a Proven-Pattern Pilot Sprint: one workflow, a fixed fee and milestone payments.",
    },
  ],
  related: ["pilot-sprint", "opportunity-assessment", "managed-ops"],
};

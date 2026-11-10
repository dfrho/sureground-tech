import type { ServiceContent } from "./types";

export const pilotSprint: ServiceContent = {
  slug: "pilot-sprint",
  headline: "One workflow, live, on proven tools.",
  intro:
    "A fixed-scope build of one back-office workflow, agent or knowledge assistant, using patterns that have already worked elsewhere.",
  whoFor: [
    "Owners ready to put AI into one real process",
    "Teams with a clear workflow and a person who owns it",
    "Businesses that finished an assessment and know their first project",
  ],
  problem:
    "Plenty of AI pilots stall before they reach production. They get stuck on data, integration or trust, and the team goes back to the old way. A sprint with a fixed scope, approval points and a launch date keeps the project small enough to finish.",
  steps: [
    {
      title: "Agree the scope",
      body: "One workflow, a written fixed price, milestone payments and a definition of live.",
    },
    {
      title: "Build on proven tools",
      body: "We configure tools you buy and write custom code only where it connects them to your data.",
    },
    {
      title: "Test with approval points",
      body: "A person approves the steps that matter, and we test against real cases before launch.",
    },
    {
      title: "Train and launch",
      body: "Your team learns to run it, and you get a written data-handling note.",
    },
  ],
  proof: ["fullstory-ai-summary", "autozone-speed", "security-reviews"],
  faq: [
    {
      q: "What happens if it isn't live in time?",
      a: "We keep working at no charge until it is. The exact terms are listed above.",
    },
    {
      q: "What counts as live?",
      a: "Your team using it on real work. We agree the specific test in writing before the sprint starts.",
    },
    {
      q: "What happens after launch?",
      a: "You run it yourselves, or we look after it with Managed AI Operations.",
    },
  ],
  related: ["managed-ops", "opportunity-assessment", "agent-development"],
};

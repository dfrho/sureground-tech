import type { ServiceContent } from "./types";

/**
 * Sold to presales and solutions engineering leaders at B2B software
 * companies, not to small-business owners, so the closing call to action
 * points to a call about the demo instead of the scorecard.
 */
export const demoSiteBuild: ServiceContent = {
  slug: "demo-site-build",
  headline: "A demo your buyers can run without you in the room.",
  intro:
    "We build a guided demo site of your product on realistic synthetic data, tailored by industry or named account, with tracking that shows which deals are leaning in.",
  whoFor: [
    "Sales engineering leaders whose team rebuilds the same demo every week",
    "B2B software teams selling into industries where real customer data can't be shown",
    "Founders and product marketers who need a demo buyers can share with their own team",
  ],
  problem:
    "Your best demo lives in one engineer's head and a fragile demo account. Data goes stale, one rep's edits break the next call, and buyers who want to look on their own get a video or nothing. Once the demo leaves the room, you lose sight of who is still interested.",
  steps: [
    {
      title: "Agree the story",
      body: "We interview your sales engineers, pick the one or two flows that win deals, and agree scope and what counts as live in writing.",
    },
    {
      title: "Build the data",
      body: "We design a synthetic dataset around your buyer's world: believable accounts, real-looking trends and a clear before and after. No customer records are used.",
    },
    {
      title: "Build the demo site",
      body: "We build the guided demo on your look and feel, with a version for each industry or account in scope.",
    },
    {
      title: "Launch on a live deal",
      body: "We connect tracking to your CRM, train your team, and send the first share link on a real opportunity.",
    },
  ],
  proof: ["se-roles", "shogun-troubleshooting"],
  faq: [
    {
      q: "Do you need access to our customer data?",
      a: "No. Every record in the demo is synthetic. We work from your product, your docs and a few interviews with your team, and nothing real goes into the build.",
    },
    {
      q: "We already pay for a demo platform. Do we need this?",
      a: "Maybe not. If your platform shows what you need, we can design the story and synthetic data for it and connect its tracking to your CRM. A coded build makes sense when screen captures can't show realistic data, complex workflows or per-account versions at your volume.",
    },
    {
      q: "What happens when our product changes?",
      a: "Optional Demo Upkeep keeps it current: updates after your releases, new customer versions and a plain-language monthly engagement report. Its price is listed above.",
    },
  ],
  related: ["answer-engine", "fractional-se", "ai-engineering"],
  cta: {
    title: "Start with one small, safe step.",
    body: "Tell us about the demo you want to fix, or talk it through on a free call.",
    links: [
      { label: "Book a free call", href: "/contact?topic=demo-build#book" },
      { label: "Send us the demo you want to fix", href: "/contact?topic=demo-build" },
    ],
  },
};

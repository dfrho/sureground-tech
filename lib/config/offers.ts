import { z } from "@/lib/zod";

/**
 * The only place on the site where prices, guarantees, credit windows and
 * durations live. Components and MDX read from here; `pnpm lint:copy` fails
 * on dollar amounts anywhere else.
 *
 * Values started as recommendations from docs/research/offerings-report.md.
 * David confirmed every price, duration, credit and guarantee as written on
 * 2026-11-09, and the plain-language credit wording on 2026-11-11. Any change needs his approval again: set that offer's
 * `confirmed` to false until he approves, and production builds fail
 * (`pnpm check:offers`) while any offer is unconfirmed.
 */

export const offerGroups = ["core", "start", "build", "specialty", "operate"] as const;
export type OfferGroup = (typeof offerGroups)[number];

export const offerSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9-]+$/),
    name: z.string().min(1),
    group: z.enum(offerGroups),
    summary: z.string().min(1),
    deliverables: z.array(z.string().min(1)).min(1),
    duration: z.string().min(1),
    /** Starting price in whole US dollars; 0 means free. */
    startingAt: z.number().int().nonnegative(),
    cadence: z.enum(["one-time", "monthly"]),
    /** Credits and guarantees, worded exactly as David approves them. */
    terms: z.array(z.string().min(1)),
    /**
     * Optional priced options within one offer. When present, startingAt
     * must equal the lowest tier price.
     */
    tiers: z
      .array(
        z
          .object({
            name: z.string().min(1),
            duration: z.string().min(1),
            startingAt: z.number().int().nonnegative(),
          })
          .strict(),
      )
      .min(2)
      .optional(),
    confirmed: z.boolean(),
  })
  .strict()
  .refine((o) => !o.tiers || o.startingAt === Math.min(...o.tiers.map((t) => t.startingAt)), {
    message: "startingAt must equal the lowest tier price",
    path: ["startingAt"],
  });

export type Offer = z.infer<typeof offerSchema>;

const offerList = [
  // Core services (the three pillars)
  {
    slug: "ai-engineering",
    name: "AI Engineering",
    group: "core",
    summary:
      "Builds AI into real workflows: integrations, data pipelines, knowledge assistants grounded in your own data, and evaluations.",
    deliverables: [
      "Integrations with the systems you already use",
      "Data pipelines that feed AI the right information",
      "Knowledge assistants grounded in your own data",
      "Evaluations that measure accuracy before launch",
    ],
    duration: "4 to 8 weeks per sprint",
    startingAt: 10000,
    cadence: "one-time",
    terms: [],
    confirmed: true,
  },
  {
    slug: "agent-development",
    name: "Agent Development",
    group: "core",
    summary:
      "Task agents with human approval points for back-office work: intake, research, drafting, reconciliation, order and ticket handling.",
    deliverables: [
      "Task agents for intake, research, drafting and reconciliation",
      "Order and ticket handling with human approval points",
      "Testing and a written data-handling note",
    ],
    duration: "4 to 8 weeks per sprint",
    startingAt: 10000,
    cadence: "one-time",
    terms: [],
    confirmed: true,
  },
  {
    slug: "ai-enablement",
    name: "AI Enablement",
    group: "core",
    summary:
      "Training so teams use AI safely and well: executive briefing, team workshops, role-based playbooks, an approved-tools guide and office hours.",
    deliverables: [
      "Executive briefing",
      "Team workshops",
      "Role-based playbooks",
      "Approved-tools guide",
      "Office hours",
    ],
    duration: "Half-day workshop, or a 4-week team program",
    startingAt: 1500,
    cadence: "one-time",
    terms: [],
    tiers: [
      { name: "Half-day workshop", duration: "Half day", startingAt: 1500 },
      { name: "Team program", duration: "4 weeks", startingAt: 4500 },
    ],
    confirmed: true,
  },

  // Start
  {
    slug: "fit-call",
    name: "AI Fit Call",
    group: "start",
    summary:
      "A 30-minute call plus a one-page plan with two or three candidate uses within 48 hours.",
    deliverables: [
      "30-minute call",
      "One-page plan with two or three candidate uses within 48 hours",
    ],
    duration: "30 minutes plus 2 days",
    startingAt: 0,
    cadence: "one-time",
    terms: [],
    confirmed: true,
  },
  {
    slug: "safe-start",
    name: "AI Safe Start",
    group: "start",
    summary:
      "Find the AI already in use, rate its risk, and put a clear policy and approved-tools list in place.",
    deliverables: [
      "Shadow-AI inventory",
      "Risk rating per tool",
      "Acceptable-use policy",
      "AI vendor checklist",
      "Approved-tools list",
    ],
    duration: "1 to 2 weeks",
    startingAt: 2500,
    cadence: "one-time",
    terms: ["Your full fee comes off any next offer you start within 60 days"],
    confirmed: true,
  },
  {
    slug: "opportunity-assessment",
    name: "AI Opportunity Assessment",
    group: "start",
    summary:
      "Map your workflows, measure baseline hours, and get a ranked list of opportunities with a 90-day roadmap.",
    deliverables: [
      "Workflow mapping",
      "Baseline hours",
      "Ranked opportunities with cost and ROI",
      "90-day roadmap with buy-versus-build picks",
    ],
    duration: "2 to 3 weeks",
    startingAt: 3500,
    cadence: "one-time",
    terms: ["Your full fee comes off a Pilot Sprint you start within 60 days"],
    confirmed: true,
  },

  // Build
  {
    slug: "pilot-sprint",
    name: "Proven-Pattern Pilot Sprint",
    group: "build",
    summary:
      "One back-office workflow, agent or knowledge assistant on proven tools, with approval points, testing, training and a written data-handling note.",
    deliverables: [
      "One back-office workflow, agent or knowledge assistant",
      "Built on proven tools",
      "Human approval points",
      "Testing and team training",
      "Written data-handling note",
    ],
    duration: "4 to 8 weeks",
    startingAt: 10000,
    cadence: "one-time",
    terms: ["Paid in milestones", "Live in 90 days or we keep working at no charge"],
    confirmed: true,
  },

  // Specialty
  {
    slug: "pilot-triage",
    name: "AI Pilot Triage",
    group: "specialty",
    summary:
      "A go, kill or fix verdict on up to two stalled AI projects, the named data or integration blocker, and a fixed-price next step.",
    deliverables: [
      "Go, kill or fix verdict on up to two stalled AI projects",
      "The named data or integration blocker",
      "A fixed-price next step",
    ],
    duration: "2 weeks",
    startingAt: 7500,
    cadence: "one-time",
    terms: ["Half your fee comes off a build with us", "Fee returned if no blocker is named"],
    confirmed: true,
  },
  {
    slug: "answer-engine",
    name: "Security Questionnaire and RFP Answer Engine",
    group: "specialty",
    summary:
      "A curated answer library and AI-governance answer set so B2B sellers clear security reviews and RFPs faster.",
    deliverables: [
      "Curated answer library",
      "AI-governance answer set",
      "Tool selection and setup",
      "Refresh process",
    ],
    duration: "3 to 4 weeks",
    startingAt: 7500,
    cadence: "one-time",
    terms: ["Optional upkeep $750 per month"],
    confirmed: true,
  },

  // Operate
  {
    slug: "managed-ops",
    name: "Managed AI Operations",
    group: "operate",
    summary:
      "Monitoring, maintenance, a monthly block of improvements and a plain-language monthly report.",
    deliverables: [
      "Monitoring",
      "Maintenance",
      "A monthly block of improvements",
      "Plain-language monthly report",
    ],
    duration: "Monthly",
    startingAt: 1000,
    cadence: "monthly",
    terms: ["Month to month, no lock-in"],
    confirmed: true,
  },
  {
    slug: "fractional-se",
    name: "Fractional AI Solutions Engineer",
    group: "operate",
    summary:
      "A hands-on AI lead: roadmap, vendor approvals, governance updates, customer security answers and one build slot.",
    deliverables: [
      "Roadmap",
      "Vendor approvals",
      "Governance updates",
      "Customer security answers",
      "One build slot",
    ],
    duration: "3-month minimum",
    startingAt: 5000,
    cadence: "monthly",
    terms: [],
    confirmed: true,
  },
] satisfies Offer[];

export const offers: readonly Offer[] = z.array(offerSchema).parse(offerList);

export type OfferSlug = (typeof offerList)[number]["slug"];

export function getOffer(slug: OfferSlug): Offer {
  const offer = offers.find((o) => o.slug === slug);
  if (!offer) throw new Error(`Unknown offer slug: ${slug}`);
  return offer;
}

export function unconfirmedOffers(list: readonly Offer[] = offers): Offer[] {
  return list.filter((o) => !o.confirmed);
}

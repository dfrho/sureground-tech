/**
 * Facts about David Rhodes. The only source is his resume (shared
 * 2026-11-10, kept outside the repo). Copy about David reads from here and
 * nowhere else (CLAUDE.md guardrail 3).
 *
 * Rules:
 * - Former employers are named as plain text: Feedonomics, FullStory,
 *   Shogun, AutoZone. Every other company is described generically.
 * - No personal contact details: no phone, home address or personal email.
 * - Roles carry no end dates, so nothing implies David works anywhere other
 *   than SureGround today.
 * - Every fact here is listed in docs/copy-review.md until David approves it.
 */

export const facts = {
  name: "David Rhodes",
  role: "Founder",
  location: "Nashville, TN",

  /** First year in enterprise sales (2004), used for "20 years" claims. */
  careerStartYear: 2004,

  education: {
    degree: "Bachelor of Journalism, Advertising",
    school: "University of Missouri",
  },
  bootcamp: {
    name: "Fullstack Academy",
    year: 2017,
  },

  /** Former employers that may be named, most recent first. */
  formerEmployers: ["Feedonomics", "FullStory", "Shogun", "AutoZone"],

  /** Career arc, oldest first. */
  career: [
    {
      id: "sales",
      title: "Enterprise account manager",
      employer: "a media business-intelligence platform",
      named: false,
      summary:
        "Sold enterprise new business and renewals to media and advertising technology buyers, and prototyped a Salesforce integration that shipped.",
    },
    {
      id: "freelance",
      title: "Freelance software engineer",
      employer: "startups in fintech, ecommerce, mobile and healthcare",
      named: false,
      summary: "Built five SaaS MVPs for startups.",
    },
    {
      id: "autozone",
      title: "Senior frontend software engineer",
      employer: "AutoZone",
      named: true,
      summary:
        "Led the turnaround of the React and TypeScript rebuild of a Fortune 500 ecommerce site, and helped move the work from outside consultants to an internal team.",
    },
    {
      id: "shogun",
      title: "Senior solutions engineer",
      employer: "Shogun",
      named: true,
      summary:
        "Built the pre-sales implementation playbook and QA template for an ecommerce CMS used by enterprise brands.",
    },
    {
      id: "fullstory",
      title: "Senior solutions engineer",
      employer: "FullStory",
      named: true,
      summary:
        "Ran enterprise proofs of concept for a digital experience platform and prototyped an AI session summary feature that leadership singled out as a standout demo.",
    },
    {
      id: "feedonomics",
      title: "Senior solutions engineer",
      employer: "Feedonomics",
      named: true,
      summary:
        "Led technical discovery and solution design for product feed, AI data enrichment and marketplace integrations across ecommerce, ERP, PIM and order systems.",
    },
  ],

  /** Short proof points with the numbers from the resume. */
  proofPoints: [
    {
      id: "autozone-speed",
      text: "Cut page load times by 23% on AutoZone's ecommerce site.",
    },
    {
      id: "shogun-troubleshooting",
      text: "Shrank average pre-sales troubleshooting at Shogun from 4 hours to 45 minutes with a real-time issue tracker.",
    },
    {
      id: "fullstory-ai-summary",
      text: "Prototyped an AI session summary feature at FullStory that leadership recognized as a standout demo.",
    },
    {
      id: "security-reviews",
      text: "Worked through security reviews against SOC 2, ISO 27001, HIPAA, PCI and GDPR requirements in enterprise sales cycles.",
    },
  ],
} as const;

export type Facts = typeof facts;

/** Whole years since the first enterprise role, rounded down to a multiple of 5. */
export function yearsOfExperience(now: Date = new Date()): number {
  const years = now.getFullYear() - facts.careerStartYear;
  return Math.floor(years / 5) * 5;
}

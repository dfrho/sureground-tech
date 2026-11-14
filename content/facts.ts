/**
 * Facts about David Rhodes. Sources: his resume (shared 2026-11-10) and,
 * for role months, his LinkedIn profile export (shared 2026-11-11); both
 * stay outside the repo. Copy about David reads from here and nowhere else
 * (CLAUDE.md guardrail 3).
 *
 * Rules:
 * - Former employers are named as plain text: Feedonomics, FullStory,
 *   Shogun, AutoZone, plus BloomForge (David's own former consultancy,
 *   approved by David 2026-11-11). Every other company is described
 *   generically.
 * - No personal contact details: no phone, home address or personal email.
 * - Every role has an end month, so nothing implies David works anywhere
 *   other than SureGround today. He left Feedonomics in October 2026.
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
  /** David, 2026-11-11: he taught himself Python before the bootcamp. */
  selfTaught: "Python",
  bootcamp: {
    name: "Fullstack Academy",
    year: 2017,
  },

  /** Former employers shown in the home proof strip, most recent first. */
  formerEmployers: ["Feedonomics", "FullStory", "Shogun", "AutoZone"],

  /** Career arc, oldest first. Months are "YYYY-MM", from LinkedIn. */
  career: [
    {
      id: "sales",
      start: "2004-04",
      end: "2015-05",
      title: "Enterprise account manager",
      employer: "a media business-intelligence platform",
      named: false,
      summary:
        "Sold enterprise new business and renewals to media and advertising technology buyers, and prototyped a Salesforce integration that shipped.",
    },
    {
      id: "freelance",
      start: "2015-05",
      end: "2019-07",
      title: "Freelance software engineer",
      employer: "startups in fintech, ecommerce, mobile and healthcare",
      named: false,
      summary: "Built five SaaS MVPs for startups.",
    },
    {
      id: "autozone",
      start: "2019-07",
      end: "2021-07",
      title: "Senior frontend software engineer",
      employer: "AutoZone",
      named: true,
      summary:
        "Led the turnaround of the React and TypeScript rebuild of a Fortune 500 ecommerce site, and helped move the work from outside consultants to an internal team.",
    },
    {
      id: "shogun",
      start: "2021-08",
      end: "2022-01",
      title: "Senior solutions engineer",
      employer: "Shogun",
      named: true,
      summary:
        "Built the pre-sales implementation playbook and QA template for an ecommerce CMS used by enterprise brands.",
    },
    {
      id: "fullstory",
      start: "2022-02",
      end: "2024-07",
      title: "Senior solutions engineer",
      employer: "FullStory",
      named: true,
      summary:
        "Ran enterprise proofs of concept for a digital experience platform and prototyped an AI session summary feature that leadership singled out as a standout demo.",
    },
    {
      id: "bloomforge",
      start: "2024-07",
      end: "2025-05",
      title: "Fractional solutions engineer",
      employer: "BloomForge",
      named: true,
      summary:
        "Founded a consultancy for fast solutions engineering and product engineering work, and built an AI-powered social application for a local founder.",
    },
    {
      id: "feedonomics",
      start: "2025-05",
      end: "2026-10",
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
      id: "se-roles",
      text: "Senior solutions engineer at Feedonomics, FullStory and Shogun, running enterprise discovery, solution design and proofs of concept.",
    },
    {
      id: "shogun-troubleshooting",
      text: "Shrank average pre-sales troubleshooting at Shogun from 4 hours to 45 minutes with a real-time issue tracker.",
    },
    {
      id: "fullstory-ai-summary",
      text: "Prototyped an AI session summary feature at FullStory that became a standout demo feature.",
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

const monthFormat = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** "2025-05" as "May 2025". */
export function formatMonth(yyyyMm: string): string {
  return monthFormat.format(new Date(`${yyyyMm}-01T00:00:00Z`));
}

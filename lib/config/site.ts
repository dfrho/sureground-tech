/**
 * Site-wide constants. No secrets here; this file is safe for client code.
 */
export const site = {
  name: "SureGround Tech",
  tagline: "AI on sure ground.",
  positioning: "You don't have to be the pioneer.",
  /** Short boilerplate from docs/brand-guide.md section 7. */
  boilerplate:
    "SureGround Tech is an AI engineering and enablement firm that puts AI to work on proven ground.",
  url: "https://sureground.tech",
  contactEmail: "david@sureground.tech",
  location: "Nashville, TN",
  /** Hosts allowed to serve the site. Used by the Server Action origin check. */
  productionHosts: ["sureground.tech", "www.sureground.tech"],
  /**
   * security.txt Expires value (RFC 9116). Renew yearly; a unit test fails
   * within 30 days of this date.
   */
  securityTxtExpires: "2027-11-09T00:00:00.000Z",
  nav: [
    { href: "/services", label: "Services" },
    { href: "/pricing", label: "Pricing" },
    { href: "/scorecard", label: "Scorecard" },
    { href: "/blog", label: "Blog" },
    { href: "/about", label: "About" },
  ],
  social: {
    linkedin: "https://www.linkedin.com/company/sureground" as string | null,
  },
} as const;

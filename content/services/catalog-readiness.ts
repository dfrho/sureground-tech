import type { ServiceContent } from "./types";

export const catalogReadiness: ServiceContent = {
  slug: "catalog-readiness",
  headline: "Product data that marketplaces and shopping ads accept.",
  intro:
    "We audit your product attributes, map them to each channel's requirements, and pilot AI enrichment on a sample of your catalog with quality rules.",
  whoFor: [
    "Ecommerce brands selling on marketplaces or running shopping ads",
    "Teams fixing feed errors and disapproved listings by hand",
    "Merchants with thin or inconsistent product attributes",
  ],
  problem:
    "Every marketplace and ad channel wants product data in its own shape. Missing or inconsistent attributes lead to rejected listings and weak ads. AI can fill gaps quickly, but only with rules that catch its mistakes before a channel does.",
  steps: [
    {
      title: "Audit attributes",
      body: "We check your catalog against what each of your channels requires.",
    },
    {
      title: "Map the channels",
      body: "We map your fields to each marketplace and shopping-ad specification.",
    },
    {
      title: "Pilot enrichment",
      body: "We run AI enrichment on a sample of products, with QA rules a person can check.",
    },
  ],
  proof: ["security-reviews"],
  faq: [
    {
      q: "Does this cover AI assistants and search?",
      a: "No. This sprint covers marketplace and shopping-ad feed requirements and data quality only.",
    },
    {
      q: "Do you change our live catalog?",
      a: "The pilot runs on a sample. You decide what goes live after reviewing the results.",
    },
  ],
  related: ["opportunity-assessment", "pilot-sprint"],
};

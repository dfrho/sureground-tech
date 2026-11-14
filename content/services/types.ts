import { z } from "@/lib/zod";

import type { facts } from "@/content/facts";
import type { OfferSlug } from "@/lib/config/offers";

/**
 * Page content for one offer. Words only: prices, durations, credits and
 * guarantees come from lib/config/offers.ts when the page renders, so they
 * never appear in these files. All of it is a draft until David approves it
 * (docs/copy-review.md).
 */
export const serviceContentSchema = z
  .object({
    slug: z.string(),
    /** H1 on the service page. */
    headline: z.string().min(1),
    /** One or two sentences under the H1. */
    intro: z.string().min(1),
    whoFor: z.array(z.string().min(1)).min(2).max(5),
    problem: z.string().min(1),
    steps: z
      .array(z.object({ title: z.string().min(1), body: z.string().min(1) }).strict())
      .min(3)
      .max(5),
    /** Why SureGround: proof point ids from content/facts.ts. */
    proof: z.array(z.string()).min(1).max(3),
    faq: z
      .array(z.object({ q: z.string().min(1), a: z.string().min(1) }).strict())
      .min(2)
      .max(5),
    /** Other offers to point to at the end of the page. */
    related: z.array(z.string()).max(3),
  })
  .strict();

type ProofPointId = (typeof facts.proofPoints)[number]["id"];

export type ServiceContent = Omit<
  z.infer<typeof serviceContentSchema>,
  "slug" | "proof" | "related"
> & {
  slug: OfferSlug;
  proof: ProofPointId[];
  related: OfferSlug[];
};

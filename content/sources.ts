import { z } from "zod";

/**
 * Cited statistics. The only place market numbers come from (CLAUDE.md
 * guardrail 3). Each one is shown with a visible citation that links to the
 * source. Every entry was checked against the live source page on the
 * `checked` date.
 */

const sourceSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    /** The number as displayed, for example "33%". */
    value: z.string().min(1),
    /** One sentence that completes the number. */
    claim: z.string().min(1),
    publisher: z.string().min(1),
    /** Who ran the survey, when the publisher only reports it. */
    via: z.string().optional(),
    title: z.string().min(1),
    url: z.url({ protocol: /^https$/ }),
    /** Publication date, YYYY-MM-DD. */
    published: z.iso.date(),
    /** Date the number was checked against the page, YYYY-MM-DD. */
    checked: z.iso.date(),
  })
  .strict();

export type Source = z.infer<typeof sourceSchema>;

const sourceList = [
  {
    id: "bluevine-privacy",
    value: "33%",
    claim:
      "of small business owners name data security and privacy as their top barrier to using AI more deeply, up from 23% a year earlier.",
    publisher: "Bluevine",
    via: "Stacker",
    title: "3 in 4 small businesses don't trust AI for basic tasks",
    url: "https://krdo.com/stacker-small-business/2026/07/16/3-4-of-small-businesses-dont-trust-ai-for-basic-tasks/",
    published: "2026-07-16",
    checked: "2026-11-10",
  },
  {
    id: "bluevine-oversight",
    value: "78%",
    claim:
      "of small business owners don't fully trust AI to handle low-level tasks without oversight.",
    publisher: "Bluevine",
    via: "Stacker",
    title: "3 in 4 small businesses don't trust AI for basic tasks",
    url: "https://krdo.com/stacker-small-business/2026/07/16/3-4-of-small-businesses-dont-trust-ai-for-basic-tasks/",
    published: "2026-07-16",
    checked: "2026-11-10",
  },
  {
    id: "goldman-training",
    value: "73%",
    claim:
      "of small businesses say they would benefit from more access to AI training and implementation resources.",
    publisher: "Goldman Sachs",
    title: "Small businesses embrace AI but need training and support to fully harness it",
    url: "https://www.goldmansachs.com/pressroom/press-releases/2026/small-businesses-embrace-ai-but-need-training-and-support-to-fully-harness-it",
    published: "2026-03-17",
    checked: "2026-11-10",
  },
] satisfies Source[];

export const sources: readonly Source[] = z.array(sourceSchema).parse(sourceList);

export type SourceId = (typeof sourceList)[number]["id"];

export function getSource(id: SourceId): Source {
  const source = sources.find((s) => s.id === id);
  if (!source) throw new Error(`Unknown source id: ${id}`);
  return source;
}

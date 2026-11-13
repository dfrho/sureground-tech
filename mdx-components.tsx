import type { MDXComponents } from "mdx/types";

import { Callout, Figure, MdxLink, OfferLink, Stat } from "@/components/blog/mdx";

/** Components available to every MDX file (content/blog). Required by @next/mdx. */
const components: MDXComponents = {
  a: MdxLink,
  Callout,
  Figure,
  Stat,
  OfferLink,
};

export function useMDXComponents(): MDXComponents {
  return components;
}

import "server-only";

import type { MDXContent } from "mdx/types";

/**
 * Loads a post body. The slug always comes from content/blog/posts.ts via
 * generateStaticParams (dynamicParams = false), never from raw user input,
 * and the import is limited to content/blog/*.mdx.
 */
export async function loadPostBody(slug: string): Promise<MDXContent> {
  const mod = (await import(`@/content/blog/${slug}.mdx`)) as { default: MDXContent };
  return mod.default;
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { needsFullPageLoad } from "@/lib/security/csp";

/** A nav link that marks itself with aria-current on its own section. */
export function NavLink({
  href,
  className = "",
  onClick,
  children,
}: {
  href: string;
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const current = pathname === href || pathname.startsWith(`${href}/`);
  const props = {
    href,
    "aria-current": current ? ("page" as const) : undefined,
    onClick,
    className: `${className} aria-[current=page]:text-text aria-[current=page]:underline aria-[current=page]:decoration-accent-text aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8`,
  };
  // Pages with their own CSP (/scorecard, /contact) need a full page load.
  if (needsFullPageLoad(href)) return <a {...props}>{children}</a>;
  return <Link {...props}>{children}</Link>;
}

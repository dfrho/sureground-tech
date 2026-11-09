"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      onClick={onClick}
      className={`${className} aria-[current=page]:text-text aria-[current=page]:underline aria-[current=page]:decoration-accent-text aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8`}
    >
      {children}
    </Link>
  );
}

import Link from "next/link";

import { needsFullPageLoad } from "@/lib/security/csp";

export type ButtonVariant = "primary" | "secondary";

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-button px-5 text-[0.9375rem] leading-5 font-semibold whitespace-nowrap underline-offset-4 hover:underline";

const variants: Record<ButtonVariant, string> = {
  // Signal Blue fill with a Carbon label in both themes (5.1:1).
  primary: "bg-accent-fill text-on-accent",
  // Transparent with a 1px text-color border.
  secondary: "border border-text text-text hover:bg-surface",
};

export function buttonClass(variant: ButtonVariant = "primary", extra = "") {
  return `${base} ${variants[variant]} ${extra}`.trim();
}

export function ButtonLink({
  href,
  variant = "primary",
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  className?: string;
  children: React.ReactNode;
}) {
  // Pages with their own CSP (/contact) need a full page load.
  if (needsFullPageLoad(href)) {
    return (
      <a href={href} className={buttonClass(variant, className)}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={buttonClass(variant, className)}>
      {children}
    </Link>
  );
}

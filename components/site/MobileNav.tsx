"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { Logo } from "@/components/brand/Logo";
import { Wordmark } from "@/components/brand/Wordmark";
import { site } from "@/lib/config/site";

import { buttonClass } from "./Button";
import { CloseIcon, MenuIcon } from "./icons";
import { NavLink } from "./NavLink";
import { ThemeToggle } from "./ThemeToggle";

/**
 * Menu for narrow screens. A native modal <dialog> gives a focus trap,
 * Escape to close, an inert page behind it and focus returned to the menu
 * button on close, with no extra library.
 */
export function MobileNav({ className = "" }: { className?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  const show = () => {
    dialog.current?.showModal();
    setOpen(true);
  };
  const close = () => dialog.current?.close();

  return (
    <div className={className}>
      <button
        type="button"
        onClick={show}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="mobile-nav"
        className="inline-flex size-11 items-center justify-center rounded-button border border-border text-text"
      >
        <MenuIcon />
        <span className="sr-only">Open menu</span>
      </button>

      <dialog
        id="mobile-nav"
        ref={dialog}
        aria-label="Menu"
        onClose={() => setOpen(false)}
        className="m-0 h-dvh max-h-none w-full max-w-none bg-bg p-0 text-text backdrop:bg-bg"
      >
        <div className="flex h-16 items-center justify-between gap-4 border-b border-border px-4 sm:px-6">
          <Link
            href="/"
            onClick={close}
            className="flex min-h-11 items-center gap-2 text-xl"
            aria-label={`${site.name} home`}
          >
            <Logo size={32} />
            <Wordmark />
          </Link>
          <button
            type="button"
            onClick={close}
            className="inline-flex size-11 items-center justify-center rounded-button border border-border"
          >
            <CloseIcon />
            <span className="sr-only">Close menu</span>
          </button>
        </div>

        <nav aria-label="Main" className="px-4 py-6 sm:px-6">
          <ul className="flex flex-col">
            {site.nav.map((item) => (
              <li key={item.href} className="border-b border-border">
                <NavLink
                  href={item.href}
                  onClick={close}
                  className="flex min-h-14 items-center font-display text-h2 text-text"
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-6 px-4 sm:px-6">
          {/* A full page load: /contact has its own CSP (lib/security/csp.ts). */}
          <a href="/contact#book" onClick={close} className={buttonClass("primary", "w-full")}>
            Book a call
          </a>
          <div className="flex items-center justify-between gap-4">
            <span className="font-mono text-label text-muted uppercase">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      </dialog>
    </div>
  );
}

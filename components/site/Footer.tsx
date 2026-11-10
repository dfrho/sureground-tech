import Link from "next/link";

import { Logo } from "@/components/brand/Logo";
import { Wordmark } from "@/components/brand/Wordmark";
import { site } from "@/lib/config/site";

const linkClass = "inline-flex min-h-11 min-w-11 items-center text-muted hover:text-text";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[2fr_1fr_1fr]">
        <div className="flex max-w-sm flex-col gap-4">
          <Link
            href="/"
            className="flex min-h-11 items-center gap-2 self-start text-xl"
            aria-label={`${site.name} home`}
          >
            <Logo size={32} />
            <Wordmark />
          </Link>
          <p className="text-muted">{site.boilerplate}</p>
          <p className="font-mono text-label text-muted uppercase">{site.location}</p>
        </div>

        <nav aria-labelledby="footer-site">
          <h2 id="footer-site" className="font-mono text-label text-muted uppercase">
            Site
          </h2>
          <ul className="mt-2">
            {site.nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/contact" className={linkClass}>
                Contact
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="font-mono text-label text-muted uppercase">Contact</h2>
          <ul className="mt-2">
            <li>
              <a href={`mailto:${site.contactEmail}`} className={linkClass}>
                {site.contactEmail}
              </a>
            </li>
            {site.social.linkedin ? (
              <li>
                <a href={site.social.linkedin} rel="me noopener" className={linkClass}>
                  LinkedIn
                </a>
              </li>
            ) : null}
            <li>
              <Link href="/legal/privacy" className={linkClass}>
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/legal/terms" className={linkClass}>
                Terms
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <p className="mx-auto max-w-6xl px-4 py-6 text-small text-muted sm:px-6">
          Copyright {year} {site.name}. {site.tagline}
        </p>
      </div>
    </footer>
  );
}

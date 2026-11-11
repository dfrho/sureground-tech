import type { Metadata } from "next";

import { LegalPage, LegalSection, listClass } from "@/components/content/LegalPage";
import { site } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "The terms for using the SureGround website.",
  alternates: { canonical: "/legal/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use" updated="November 10, 2026">
      {/* COPY: draft (needs David's approval and a lawyer's review before launch) */}
      <p>
        These terms cover your use of {site.url.replace("https://", "")}, run by David Rhodes as{" "}
        {site.name} in {site.location}. By using the site, you agree to them.
      </p>

      <LegalSection title="The site is information, not advice">
        <p>
          Articles, the First Step Scorecard and other content on this site are general information.
          The scorecard is a self-assessment, not an audit. None of it is legal, security, financial
          or professional advice for your situation.
        </p>
      </LegalSection>

      <LegalSection title="Prices and engagements">
        <p>
          Prices on this site are starting points. Any engagement is governed by a separate written
          agreement that sets the scope, fee and terms. If that agreement and this site differ, the
          agreement applies.
        </p>
      </LegalSection>

      <LegalSection title="Using the site">
        <p>Please don&apos;t:</p>
        <ul className={listClass}>
          <li>send spam or automated submissions through the forms;</li>
          <li>try to disrupt, overload or gain unauthorized access to the site;</li>
          <li>submit information about other people without their permission.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Content and trademarks">
        <p>
          The content, design and logo on this site belong to {site.name}. You may share links and
          short quotes with credit. Company names mentioned on this site belong to their owners and
          do not imply endorsement.
        </p>
      </LegalSection>

      <LegalSection title="Links to other sites">
        <p>
          The site links to sources and services run by others. We are not responsible for their
          content or their privacy practices.
        </p>
      </LegalSection>

      <LegalSection title="Security issues">
        <p>
          If you find a security issue, please report it to {site.contactEmail}. Our contact details
          are also published at /.well-known/security.txt.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>If these terms change, the date at the top of this page changes with it.</p>
      </LegalSection>
    </LegalPage>
  );
}

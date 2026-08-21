import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Eyebrow } from "@/components/ui/Marks";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you were looking for does not exist.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader />

      <main id="main" tabIndex={-1}>
        <section className="surface-ink pb-[var(--section-y-lg)] pt-[calc(var(--header-h)+var(--section-y-lg))]">
          <div className="content">
            {/* Two columns, so the page does not leave half the screen blank on
                a desktop while the useful part hugs the left edge. */}
            <div className="grid12">
              <div className="md:col-span-6 lg:col-span-5">
                <Eyebrow>Error 404</Eyebrow>
                <h1 className="t-h1 mt-6 max-w-[14ch] text-[color:var(--color-text-invert)]">
                  That page does not exist.
                </h1>
                <p className="t-lead measure mt-6">
                  The link may be out of date, or the address may have a typo.
                  These are the pages worth trying.
                </p>
              </div>

              <ul className="md:col-span-6 lg:col-span-6 lg:col-start-7">
              {[
                { href: "/", label: "Home", note: "Positioning, capabilities and how we work" },
                { href: "/proposition", label: "Our Proposition", note: "The constraint we solve, our capabilities and experience" },
                { href: "/blog", label: "Insights", note: "Thinking on transformation, technology and AI" },
                { href: "/contact", label: "Contact", note: "Book a 60-minute discovery session" },
                { href: "/privacy", label: "Privacy notice", note: "What we collect and how to have it removed" },
              ].map((link) => (
                <li
                  key={link.href}
                  className="border-t border-[color:var(--color-line-invert)] last:border-b"
                >
                  <Link
                    href={link.href}
                    className="flex flex-col gap-1 py-5 transition-colors duration-150 hover:text-[color:var(--color-accent-invert)]"
                  >
                    <span className="t-h4">{link.label}</span>
                    <span className="t-caption text-[color:var(--color-text-invert-muted)]">
                      {link.note}
                    </span>
                  </Link>
                </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

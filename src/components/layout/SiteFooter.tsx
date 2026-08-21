import Link from "next/link";

import { ContactChannelLinks } from "@/components/contact/ContactChannels";
import { Logo } from "@/components/ui/Logo";
import { capabilities } from "@/content/home";
import { site } from "@/lib/site";

const exploreLinks = [
  { label: "Home", href: "/" },
  { label: "Our Proposition", href: "/proposition" },
  { label: "Ways to Engage", href: "/#ways-to-engage" },
  { label: "Insights", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="surface-ink">
      <div className="content section">
        <div className="grid12">
          <div className="lg:col-span-4 md:col-span-6">
            <Link href="/" className="inline-block">
              <Logo />
            </Link>
            <p className="t-h3 measure-tight mt-6 text-[color:var(--color-text-invert)]">
              {site.tagline}
            </p>
            <p className="t-small measure-tight mt-4 text-[color:var(--color-text-invert-muted)]">
              {site.description}
            </p>
          </div>

          <div className="md:col-span-3 lg:col-span-2 lg:col-start-5">
            <h2 className="t-eyebrow">Explore</h2>
            <ul className="mt-5 flex flex-col gap-3">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="t-small inline-flex min-h-[2rem] items-center text-[color:var(--color-text-invert-muted)] transition-colors duration-150 hover:text-[color:var(--color-text-invert)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3 lg:col-span-3">
            <h2 className="t-eyebrow">What we do</h2>
            <ul className="mt-5 flex flex-col gap-3">
              {capabilities.pillars.map((pillar) => (
                <li key={pillar.id}>
                  <Link
                    href={`/proposition#${pillar.id}`}
                    className="t-small inline-flex min-h-[2rem] items-center text-[color:var(--color-text-invert-muted)] transition-colors duration-150 hover:text-[color:var(--color-text-invert)]"
                  >
                    {pillar.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-6 lg:col-span-3">
            <h2 className="t-eyebrow">Start a conversation</h2>
            <ul className="mt-5 flex flex-col gap-3">
              <li>
                <a
                  className="t-small link"
                  href={`mailto:${site.contact.email}`}
                >
                  {site.contact.email}
                </a>
              </li>
              {site.contact.phone ? (
                <li>
                  <a
                    className="t-small link"
                    href={`tel:${site.contact.phone.replace(/[^+\d]/g, "")}`}
                  >
                    {site.contact.phone}
                  </a>
                </li>
              ) : null}
              {site.contact.addressLines.length > 0 ? (
                <li>
                  <address className="t-small not-italic text-[color:var(--color-text-invert-muted)]">
                    {site.contact.addressLines.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </address>
                </li>
              ) : null}
            </ul>

            <ContactChannelLinks tone="ink" label={null} className="mt-6" />

          </div>
        </div>

        <hr className="rule-invert mt-12 border-t" />

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="t-caption flex flex-wrap items-center gap-x-4 gap-y-2 text-[color:var(--color-text-invert-muted)]">
            <span>
              © {year} {site.name}. All rights reserved.
            </span>
            <Link
              href="/privacy"
              className="inline-flex min-h-[2rem] items-center py-0.5 underline underline-offset-4 transition-colors duration-150 hover:text-[color:var(--color-text-invert)]"
            >
              Privacy notice
            </Link>
            <Link
              href="/admin/login"
              rel="nofollow"
              className="inline-flex min-h-[2rem] items-center py-0.5 underline underline-offset-4 transition-colors duration-150 hover:text-[color:var(--color-text-invert)]"
            >
              Team sign in
            </Link>
          </p>
          <p className="t-caption max-w-[52ch] text-[color:var(--color-text-invert-muted)]">
            Outcomes described on this site are outcomes we are designed to
            support, not guaranteed results.
          </p>
        </div>
      </div>
    </footer>
  );
}

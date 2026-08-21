import type { Metadata } from "next";
import Link from "next/link";

import { ContactForm } from "@/components/contact/ContactForm";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/ui/Breadcrumbs";
import { Eyebrow } from "@/components/ui/Marks";
import { finalCta } from "@/content/home";
import { jsonLdScript } from "@/lib/seo";
import { absoluteUrl, site } from "@/lib/site";
import { pad2 } from "@/lib/utils";

const TITLE = "Contact";
const DESCRIPTION =
  "Book a 60-minute discovery session with Anvukta Consulting Service. We work out which constraint is costing you most, and whether a diagnostic is worth doing.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl("/contact") },
  openGraph: {
    type: "website",
    url: absoluteUrl("/contact"),
    title: `${TITLE} | ${site.name}`,
    description: DESCRIPTION,
    images: [{ url: site.ogImagePath, width: 1200, height: 630, alt: site.name }],
  },
};

const whatHappensNext = [
  "A person reads your message. It does not go to a sales desk first.",
  "You get a reply within two working days, usually sooner.",
  "If a conversation makes sense, we propose a 60-minute discovery session.",
  "If it does not, we will say so and point you somewhere more useful.",
];

export default function ContactPage() {
  const graph = [
    {
      "@type": "ContactPage",
      "@id": `${absoluteUrl("/contact")}#webpage`,
      url: absoluteUrl("/contact"),
      name: `${TITLE} | ${site.name}`,
      description: DESCRIPTION,
      inLanguage: "en",
      isPartOf: { "@id": absoluteUrl("/#website") },
      about: { "@id": absoluteUrl("/#organization") },
    },
    breadcrumbJsonLd([{ label: TITLE }], absoluteUrl("/contact")),
  ];

  return (
    <>
      <div className="surface-ink pb-[var(--section-y)] pt-[calc(var(--header-h)+var(--section-y))]">
        <div className="content">
          <Breadcrumbs trail={[{ label: TITLE }]} />

          <div className="grid12 mt-8">
            <div className="lg:col-span-7 md:col-span-6">
              <Eyebrow>{finalCta.eyebrow}</Eyebrow>
              <h1 className="t-h1 mt-5 max-w-[16ch] text-[color:var(--color-text-invert)]">
                Let us start with the constraint that matters most.
              </h1>
              <p className="t-lead measure mt-6">
                Tell us what is stalling. One focused conversation is usually
                enough to tell whether further work is worth doing, and we will say
                so either way.
              </p>
              <p className="t-small mt-5 text-[color:var(--color-text-invert-muted)]">
                Not ready yet? Read{" "}
                <Link href="/proposition" className="link">
                  how we close the gap between decision and delivery
                </Link>{" "}
                or browse our{" "}
                <Link href="/blog" className="link">
                  writing on transformation and AI
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="content section">
        <div className="grid12">
          <div className="lg:col-span-7 md:col-span-6">
            <h2 className="t-h2 max-w-[18ch]">Send us a message</h2>
            <hr className="rule mt-6" />
            <div className="mt-8">
              <ContactForm />
            </div>
          </div>

          <aside
            className="lg:col-span-4 lg:col-start-9 md:col-span-6"
            aria-labelledby="what-next-heading"
          >
            <div className="border-t-2 border-[color:var(--color-ink)] pt-6">
              <h2 id="what-next-heading" className="t-h3">
                What happens next
              </h2>
              <ol className="mt-6">
                {whatHappensNext.map((step, index) => (
                  <li
                    key={step}
                    className="flex gap-4 border-b border-[color:var(--color-line)] py-4"
                  >
                    <span className="t-index pt-[0.2rem]">{pad2(index + 1)}</span>
                    <p className="t-small">{step}</p>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-10 border-t border-[color:var(--color-line)] pt-6">
              <h2 className="t-eyebrow">Direct</h2>
              <ul className="mt-4 flex flex-col gap-2">
                <li>
                  <a href={`mailto:${site.contact.email}`} className="link t-small">
                    {site.contact.email}
                  </a>
                </li>
                {site.contact.phone ? (
                  <li>
                    <a
                      href={`tel:${site.contact.phone.replace(/[^+\d]/g, "")}`}
                      className="link t-small"
                    >
                      {site.contact.phone}
                    </a>
                  </li>
                ) : null}
                {site.contact.addressLines.length > 0 ? (
                  <li>
                    <address className="t-small not-italic text-[color:var(--color-text-muted)]">
                      {site.contact.addressLines.map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                    </address>
                  </li>
                ) : null}
              </ul>
            </div>

            <div className="mt-10 border-t border-[color:var(--color-line)] pt-6">
              <h2 className="t-eyebrow">Confidentiality</h2>
              <p className="t-small measure-tight mt-4 text-[color:var(--color-text-muted)]">
                What you send is treated as commercially confidential. We use
                your details only to respond to this enquiry, we do not sell or
                share them, and we will remove them on request. Please do not
                include client-identifying or regulated information in a first
                message.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript({ "@context": "https://schema.org", "@graph": graph }),
        }}
      />
    </>
  );
}

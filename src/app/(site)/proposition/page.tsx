import type { Metadata } from "next";
import Link from "next/link";

import { CapabilitiesSection } from "@/components/proposition/CapabilitiesSection";
import {
  ChallengeSection,
  SymptomsSection,
} from "@/components/proposition/ChallengeSection";
import {
  CaseStoriesSection,
  LeadershipSection,
  SectorsSection,
} from "@/components/proposition/ExperienceSection";
import {
  OutcomesSection,
  PropositionSection,
} from "@/components/proposition/PropositionSection";
import { ContactChannelLinks } from "@/components/contact/ContactChannels";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/ui/Breadcrumbs";
import { Eyebrow } from "@/components/ui/Marks";
import {
  ChapterRule,
  ImageBandBreaker,
} from "@/components/ui/SectionBreaker";
import { capabilities } from "@/content/home";
import { jsonLdScript } from "@/lib/seo";
import { absoluteUrl, site } from "@/lib/site";

const TITLE = "Our Proposition";
const DESCRIPTION =
  "Why transformation programmes stall between decision and delivery, what Anvukta Consulting Service does about it, and the capabilities we bring to the work.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl("/proposition") },
  openGraph: {
    type: "website",
    url: absoluteUrl("/proposition"),
    title: `${TITLE} | ${site.name}`,
    description: DESCRIPTION,
    images: [{ url: site.ogImagePath, width: 1200, height: 630, alt: site.name }],
  },
};

export default function PropositionPage() {
  const graph = [
    {
      "@type": "WebPage",
      "@id": `${absoluteUrl("/proposition")}#webpage`,
      url: absoluteUrl("/proposition"),
      name: `${TITLE} | ${site.name}`,
      description: DESCRIPTION,
      inLanguage: "en",
      isPartOf: { "@id": absoluteUrl("/#website") },
      about: { "@id": absoluteUrl("/#organization") },
    },
    breadcrumbJsonLd([{ label: TITLE }], absoluteUrl("/proposition")),
    // Search engines cannot infer a consultancy's services from prose. This
    // lists them explicitly, grouped by the same three pillars the page shows.
    {
      "@type": "OfferCatalog",
      "@id": `${absoluteUrl("/proposition")}#services`,
      name: "Advisory and transformation services",
      provider: { "@id": absoluteUrl("/#organization") },
      itemListElement: capabilities.pillars.map((pillar, pillarIndex) => ({
        "@type": "OfferCatalog",
        position: pillarIndex + 1,
        name: pillar.name,
        description: pillar.summary,
        itemListElement: pillar.capabilities.map((capability, index) => ({
          "@type": "Offer",
          position: index + 1,
          itemOffered: {
            "@type": "Service",
            name: capability.name,
            description: capability.value,
            serviceType: pillar.name,
            provider: { "@id": absoluteUrl("/#organization") },
            areaServed: site.contact.region,
          },
        })),
      })),
    },
  ];

  return (
    <>
      <div className="surface-ink pb-[var(--section-y)] pt-[calc(var(--header-h)+var(--section-y))]">
        <div className="content">
          <Breadcrumbs trail={[{ label: TITLE }]} />

          <div className="grid12 mt-8">
            <div className="lg:col-span-8 md:col-span-6">
              <Eyebrow>{site.descriptor}</Eyebrow>
              <h1 className="t-h1 mt-5 max-w-[14ch] text-[color:var(--color-text-invert)]">
                {TITLE}
              </h1>
              <p className="t-lead measure mt-6">
                Where transformation stalls, what we do about it, and the evidence
                behind it.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rhythm: no two neighbouring sections share a shape or a ground. */}
      <PropositionSection />

      <ChapterRule index={1} label="The constraint" tone="warm" />
      <ChallengeSection />

      <ImageBandBreaker
        src="/media/breaker-facade.jpg"
        alt="A repeating grid of glass and steel, every panel depending on the frame around it."
        eyebrow="Why it matters"
      >
        A break at any single link stalls the whole programme.
      </ImageBandBreaker>

      <SymptomsSection />
      <OutcomesSection />

      <ChapterRule index={2} label="Capabilities" />
      <CapabilitiesSection />

      <SectorsSection />
      <LeadershipSection />
      <CaseStoriesSection />

      <section className="surface-warm section" aria-labelledby="proposition-cta-heading">
        <div className="content flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 id="proposition-cta-heading" className="t-h2 max-w-[18ch]">
              See how this would apply to your organisation.
            </h2>
            <p className="t-lead measure-lead mt-4">
              A 60-minute executive discovery session identifies the highest-value
              constraint and whether a diagnostic is justified.{" "}
              <Link href="/#how-we-work" className="link">
                See how we work
              </Link>
              .
            </p>
          </div>
          <ContactChannelLinks className="shrink-0" />
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript({ "@context": "https://schema.org", "@graph": graph }),
        }}
      />
    </>
  );
}

import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { jsonLdScript } from "@/lib/seo";
import { absoluteUrl, site } from "@/lib/site";

/** Site-wide Organization + WebSite structured data. Only truthful claims. */
function OrganizationJsonLd() {
  const sameAs = [site.social.linkedin, site.social.x].filter(Boolean);

  const graph = [
    {
      "@type": "Organization",
      "@id": absoluteUrl("/#organization"),
      name: site.name,
      alternateName: site.shortName,
      url: site.url,
      description: site.description,
      slogan: site.tagline,
      email: site.contact.email,
      knowsAbout: [
        "Business transformation",
        "Operating-model advisory",
        "Digital and AI transformation strategy",
        "Programme governance and recovery",
        "Cloud architecture and cost optimisation",
        "Data, analytics and executive decision systems",
        "Customer experience and omnichannel",
      ],
      ...(sameAs.length > 0 ? { sameAs } : {}),
      ...(site.contact.phone
        ? {
            contactPoint: [
              {
                "@type": "ContactPoint",
                contactType: "sales",
                email: site.contact.email,
                telephone: site.contact.phone,
                availableLanguage: ["en"],
              },
            ],
          }
        : {}),
    },
    {
      "@type": "WebSite",
      "@id": absoluteUrl("/#website"),
      url: site.url,
      name: site.name,
      description: site.description,
      inLanguage: "en",
      publisher: { "@id": absoluteUrl("/#organization") },
    },
  ];

  return (
    <script
      type="application/ld+json"
      // Values come from the site's own configuration, never from user input.
      dangerouslySetInnerHTML={{
        __html: jsonLdScript({ "@context": "https://schema.org", "@graph": graph }),
      }}
    />
  );
}

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1}>{children}</main>
      <SiteFooter />
      <ChatPanel />
      <OrganizationJsonLd />
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs, breadcrumbJsonLd } from "@/components/ui/Breadcrumbs";
import { Eyebrow } from "@/components/ui/Marks";
import { privacy } from "@/content/privacy";
import { jsonLdScript } from "@/lib/seo";
import { absoluteUrl, site } from "@/lib/site";
import { formatDate, isoDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: privacy.title,
  description: privacy.description,
  alternates: { canonical: absoluteUrl("/privacy") },
  openGraph: {
    type: "website",
    url: absoluteUrl("/privacy"),
    title: `${privacy.title} | ${site.name}`,
    description: privacy.description,
    images: [{ url: site.ogImagePath, width: 1200, height: 630, alt: site.name }],
  },
};

export default function PrivacyPage() {
  const graph = [
    {
      "@type": "WebPage",
      "@id": `${absoluteUrl("/privacy")}#webpage`,
      url: absoluteUrl("/privacy"),
      name: `${privacy.title} | ${site.name}`,
      description: privacy.description,
      inLanguage: "en",
      dateModified: isoDate(privacy.lastUpdated),
      isPartOf: { "@id": absoluteUrl("/#website") },
      about: { "@id": absoluteUrl("/#organization") },
    },
    breadcrumbJsonLd([{ label: privacy.title }], absoluteUrl("/privacy")),
  ];

  return (
    <>
      <div className="surface-ink pb-[var(--section-y)] pt-[calc(var(--header-h)+var(--section-y))]">
        <div className="content">
          <Breadcrumbs trail={[{ label: privacy.title }]} />

          <div className="grid12 mt-8">
            <div className="lg:col-span-8 md:col-span-6">
              <Eyebrow>Legal</Eyebrow>
              <h1 className="t-h1 mt-5 max-w-[14ch] text-[color:var(--color-text-invert)]">
                {privacy.title}
              </h1>
              <p className="t-lead measure mt-6">{privacy.intro}</p>
              <p className="t-caption mt-6 text-[color:var(--color-text-invert-muted)]">
                Last updated{" "}
                <time dateTime={isoDate(privacy.lastUpdated)}>
                  {formatDate(privacy.lastUpdated)}
                </time>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="content section">
        <div className="grid12">
          <aside
            className="lg:col-span-3 md:col-span-6"
            aria-labelledby="privacy-contents"
          >
            <div className="lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
              <h2 id="privacy-contents" className="t-eyebrow">
                On this page
              </h2>
              <nav aria-labelledby="privacy-contents" className="mt-4">
                <ul className="flex flex-col gap-3 border-l border-[color:var(--color-line)] pl-4">
                  {privacy.sections.map((section) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className="t-small text-[color:var(--color-text-muted)] transition-colors duration-150 hover:text-[color:var(--color-text)]"
                      >
                        {section.heading}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </aside>

          <div className="lg:col-span-8 lg:col-start-5 md:col-span-6">
            {privacy.sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-[calc(var(--header-h)+1rem)] border-t border-[color:var(--color-line)] py-9 first:border-t-0 first:pt-0"
                aria-labelledby={`${section.id}-heading`}
              >
                <h2 id={`${section.id}-heading`} className="t-h3">
                  {section.heading}
                </h2>

                {section.body.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="measure mt-4 text-[length:var(--text-body-lg)] leading-[1.7]"
                  >
                    {paragraph}
                  </p>
                ))}

                {/* tabIndex makes the scroll region keyboard-reachable; the role
                    and name tell a screen-reader user what they have landed in. */}
                {"table" in section && section.table ? (
                  <div
                    className="data-table mt-7 sm:overflow-x-auto"
                    tabIndex={0}
                    role="region"
                    aria-label={section.table.caption}
                  >
                    <table className="w-full border-collapse text-left sm:min-w-[34rem]">
                      <caption className="t-caption pb-3 text-[color:var(--color-text-muted)]">
                        {section.table.caption}
                      </caption>
                      <thead>
                        <tr className="border-b border-[color:var(--color-line-strong)]">
                          {section.table.head.map((cell) => (
                            <th key={cell} scope="col" className="t-label py-3 pr-4 text-[color:var(--color-text-muted)]">
                              {cell}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.table.rows.map((row) => (
                          <tr
                            key={row[0]}
                            className="border-b border-[color:var(--color-line)]"
                          >
                            {/* data-label carries the column heading down to the
                                stacked layout, where the header row is hidden. */}
                            <th
                              scope="row"
                              data-label={section.table.head[0]}
                              className="t-small py-3 pr-4 font-medium align-top"
                            >
                              {row[0]}
                            </th>
                            <td
                              data-label={section.table.head[1]}
                              className="t-small py-3 pr-4 align-top text-[color:var(--color-text-muted)]"
                            >
                              {row[1]}
                            </td>
                            <td
                              data-label={section.table.head[2]}
                              className="t-small measure py-3 pr-4 align-top"
                            >
                              {row[2]}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </section>
            ))}

            <div className="border-t-2 border-[color:var(--color-ink)] pt-6">
              <h2 className="t-h3">Asking us about your data</h2>
              <p className="measure mt-4 text-[length:var(--text-body-lg)] leading-[1.7]">
                Email{" "}
                <a href={`mailto:${site.contact.email}`} className="link">
                  {site.contact.email}
                </a>{" "}
                with what you want: a copy, a correction, or deletion. Put
                &ldquo;privacy&rdquo; in the subject line so it reaches the right
                person quickly.
              </p>
              <Link href="/contact" className="btn btn-secondary mt-6">
                Or use the contact form
              </Link>
            </div>
          </div>
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

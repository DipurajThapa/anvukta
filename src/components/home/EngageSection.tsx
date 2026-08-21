import Link from "next/link";

import { ContactChannels } from "@/components/contact/ContactChannels";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Eyebrow } from "@/components/ui/Marks";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { engagements, finalCta } from "@/content/home";
import { pad2 } from "@/lib/utils";

export function WaysToEngageSection() {
  return (
    <section
      id="ways-to-engage"
      className="section scroll-mt-[var(--header-h)]"
      aria-labelledby="ways-to-engage-heading"
    >
      <div className="content">
        <SectionHeader
          eyebrow={engagements.eyebrow}
          heading={engagements.heading}
          headingId="ways-to-engage-heading"
        />

        {/* Three rows shared across the cards, so the number, the title and the
            list below all start level whatever length each title runs to. These
            cards are read across, and a comparison that does not line up is
            harder to compare. */}
        <div className="grid12 mt-12 lg:grid-rows-[auto_auto_1fr]">
          {engagements.items.map((item, index) => (
            <article
              key={item.id}
              className="flex flex-col border-t-2 border-[color:var(--color-ink)] pt-6 md:col-span-3 lg:col-span-4 lg:row-span-3 lg:grid lg:grid-rows-subgrid lg:gap-0"
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="t-index">{pad2(index + 1)}</span>
                  <Icon
                    name={item.icon as IconName}
                    size="lg"
                    className="text-[color:var(--color-accent-text)]"
                  />
                </div>
              </div>

              <h3 className="t-h3 mt-3 text-balance">{item.name}</h3>

              <dl className="mt-6 flex flex-col gap-4">
                  <div>
                    <dt className="t-eyebrow">Who it is for</dt>
                    <dd className="t-small mt-1.5">{item.buyer}</dd>
                  </div>
                  <div>
                    <dt className="t-eyebrow">Business problem</dt>
                    <dd className="measure-tight mt-1.5 text-[color:var(--color-text-muted)]">
                      {item.problem}
                    </dd>
                  </div>
                  <div>
                    <dt className="t-eyebrow">Typical scope</dt>
                    <dd className="t-small mt-1.5">{item.scope}</dd>
                  </div>
                  <div>
                    <dt className="t-eyebrow">Expected outcome</dt>
                    <dd className="measure-tight mt-1.5">{item.outcome}</dd>
                  </div>
                  <div>
                    <dt className="t-eyebrow">Decision point</dt>
                    <dd className="measure-tight mt-1.5 text-[color:var(--color-text-muted)]">
                      {item.decision}
                    </dd>
                  </div>
              </dl>
            </article>
          ))}
        </div>

        <p className="t-caption measure mt-10 text-[color:var(--color-text-muted)]">
          {engagements.note}{" "}
          <Link href="/proposition#capabilities" className="link">
            See the ten capability areas we work across
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

export function FinalCtaSection() {
  return (
    <section className="surface-ink section-lg" aria-labelledby="final-cta-heading">
      <div className="content">
        <div className="grid12">
          <div className="md:col-span-6 lg:col-span-7">
            <Eyebrow>{finalCta.eyebrow}</Eyebrow>
            <h2
              id="final-cta-heading"
              className="t-h1 mt-6 max-w-[16ch] text-[color:var(--color-text-invert)]"
            >
              {finalCta.heading}
            </h2>
            <p className="t-lead measure-lead mt-6">{finalCta.lead}</p>

            <ContactChannels tone="ink" className="mt-10" />
          </div>

          <div className="lg:col-span-4 lg:col-start-9 md:col-span-6">
            <h3 className="t-eyebrow">What the session covers</h3>
            <ul className="mt-6">
              {finalCta.purpose.map((purpose, index) => (
                <li
                  key={purpose}
                  className="flex gap-5 border-t border-[color:var(--color-line-invert)] py-5 last:border-b"
                >
                  <span className="t-index pt-[0.2rem]">{pad2(index + 1)}</span>
                  <p className="measure-tight text-[color:var(--color-text-invert)]">
                    {purpose}
                  </p>
                </li>
              ))}
            </ul>
            <p className="t-caption measure-tight mt-6 text-[color:var(--color-text-invert-muted)]">
              {finalCta.close}
            </p>
            <p className="t-small mt-6">
              Prefer to read first?{" "}
              <Link href="/blog" className="link">
                Browse our Insights
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

import { Icon } from "@/components/ui/Icon";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { capabilities } from "@/content/home";
import { pad2 } from "@/lib/utils";

/**
 * Capabilities use native <details> for progressive disclosure: the deeper
 * problem → intervention → value detail is in the HTML for crawlers and for
 * users without JavaScript, but the homepage stays scannable.
 */
export function CapabilitiesSection() {
  return (
    <section
      id="capabilities"
      className="section scroll-mt-[var(--header-h)]"
      aria-labelledby="capabilities-heading"
    >
      <div className="content">
        <SectionHeader
          eyebrow={capabilities.eyebrow}
          heading={capabilities.heading}
          lead={capabilities.lead}
          headingId="capabilities-heading"
        />

        <div className="mt-14 flex flex-col gap-16 lg:gap-20">
          {capabilities.pillars.map((pillar, pillarIndex) => (
            <div key={pillar.id} id={pillar.id} className="scroll-mt-[var(--header-h)]">
              <div className="grid12">
                <div className="md:col-span-6 lg:col-span-4">
                  <span className="t-index">
                    Pillar {pad2(pillarIndex + 1)} / {pad2(capabilities.pillars.length)}
                  </span>
                  <h3 className="t-h2 mt-4 max-w-[14ch]">{pillar.name}</h3>
                  <p className="t-lead measure-tight mt-4">{pillar.summary}</p>
                </div>

                <div className="lg:col-span-7 lg:col-start-6 md:col-span-6">
                  <ul>
                    {pillar.capabilities.map((capability, index) => (
                      <li key={capability.id} className="border-t border-[color:var(--color-line-strong)] last:border-b">
                        <details className="group" name={pillar.id}>
                          <summary className="flex cursor-pointer list-none items-start gap-5 py-5 [&::-webkit-details-marker]:hidden">
                            <span className="t-index pt-[0.4rem]">
                              {pad2(index + 1)}
                            </span>
                            <span className="flex-1">
                              <span className="t-h4 block">{capability.name}</span>
                              <span className="t-caption mt-2 block text-[color:var(--color-text-muted)]">
                                {capability.problem}
                              </span>
                            </span>
                            <span className="mt-1.5 grid h-[3rem] w-[3rem] flex-none place-items-center rounded-full border border-[color:var(--color-line-strong)] transition-colors duration-150 group-hover:border-[color:var(--color-accent)] group-open:border-[color:var(--color-accent)] group-open:bg-[color:var(--color-accent)] group-open:text-white">
                              <Icon
                                name="chevron-down"
                                size="md"
                                className="transition-transform duration-200 group-open:rotate-180"
                              />
                            </span>
                          </summary>

                          <div className="border-l-2 border-[color:var(--color-accent)] pb-6 pl-5 md:ml-12">
                            <dl className="flex flex-col gap-4">
                              <div>
                                <dt className="t-eyebrow">What we do</dt>
                                <dd className="measure mt-2">
                                  {capability.intervention}
                                </dd>
                              </div>
                              <div>
                                <dt className="t-eyebrow">Business value</dt>
                                <dd className="measure mt-2">{capability.value}</dd>
                              </div>
                              <div>
                                <dt className="t-eyebrow">Typical decision-maker</dt>
                                <dd className="t-small mt-2 text-[color:var(--color-text-muted)]">
                                  {capability.decisionMaker}
                                </dd>
                              </div>
                            </dl>
                          </div>
                        </details>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

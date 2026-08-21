import { EngagementRing } from "@/components/home/EngagementRing";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { engagementModel } from "@/content/home";
import { pad2 } from "@/lib/utils";

export function EngagementSection() {
  return (
    <section
      id="how-we-work"
      className="section scroll-mt-[var(--header-h)]"
      aria-labelledby="how-we-work-heading"
    >
      <div className="content">
        <SectionHeader
          eyebrow={engagementModel.eyebrow}
          heading={engagementModel.heading}
          lead={engagementModel.lead}
          headingId="how-we-work-heading"
        />

        <div className="grid12 mt-14">
          <div className="md:col-span-6 lg:col-span-4">
            {/* Sticky so the ring stays beside whichever stage is being read. */}
            <div className="lg:sticky lg:top-[calc(var(--header-h)+3rem)]">
              <div className="text-[color:var(--color-text)]">
                <EngagementRing
                  stages={engagementModel.stages}
                  titleId="engagement-ring-title"
                />
              </div>

              <p className="measure-tight mt-8 border-l-2 border-[color:var(--color-accent)] pl-5 text-[color:var(--color-text-muted)]">
                {engagementModel.gateNote}
              </p>
            </div>
          </div>

          <ol className="lg:col-span-7 lg:col-start-6 md:col-span-6">
            {engagementModel.stages.map((stage, index) => (
              <li
                key={stage.name}
                data-stage-index={index}
                className="border-t border-[color:var(--color-line)] py-8 last:border-b"
              >
                <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
                  <span className="t-index">{pad2(index + 1)}</span>
                  <h3 className="t-h3">{stage.name}</h3>
                </div>

                <p className="measure mt-3">{stage.purpose}</p>

                {/* Output then gate, stacked, so the sequence reads downward. */}
                <dl className="mt-5 flex flex-col gap-4">
                  <div className="border-l-2 border-[color:var(--color-line-strong)] pl-4">
                    <dt className="t-eyebrow">Principal output</dt>
                    <dd className="t-small measure mt-1.5">{stage.output}</dd>
                  </div>
                  <div className="border-l-2 border-[color:var(--color-accent)] pl-4">
                    <dt className="t-eyebrow">Decision gate</dt>
                    <dd className="t-small measure mt-1.5">{stage.gate}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

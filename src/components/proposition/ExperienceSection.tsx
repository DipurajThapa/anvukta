import Image from "next/image";

import { Icon, type IconName } from "@/components/ui/Icon";
import { Eyebrow } from "@/components/ui/Marks";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { caseStories, leadership, sectors } from "@/content/home";
import { pad2 } from "@/lib/utils";

export function SectorsSection() {
  return (
    <section
      id="experience"
      className="surface-warm section scroll-mt-[var(--header-h)]"
      aria-labelledby="sectors-heading"
    >
      <div className="content">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>{sectors.eyebrow}</Eyebrow>
            <h2 id="sectors-heading" className="t-h2 mt-5 max-w-[18ch]">
              {sectors.heading}
            </h2>
          </div>
          <p className="t-caption max-w-[38ch] text-[color:var(--color-text-muted)] md:text-right">
            {sectors.note}
          </p>
        </div>

        <hr className="rule mt-10" />

        <ul className="grid12">
          {sectors.items.map((sector, index) => (
            <li
              key={sector.name}
              className="flex items-start gap-4 border-b border-[color:var(--color-line)] py-6 md:col-span-3 lg:col-span-4"
            >
              <Icon
                name={sector.icon as IconName}
                size="lg"
                className="mt-0.5 text-[color:var(--color-accent-text)]"
              />
              <div>
                <span className="t-index">{pad2(index + 1)}</span>
                <p className="t-h4 mt-1">{sector.name}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function LeadershipSection() {
  return (
    <section className="surface-ink section" aria-labelledby="leadership-heading">
      <div className="content">
        <Eyebrow>{leadership.eyebrow}</Eyebrow>

        <div className="grid12 mt-8">
          {/* One photograph on this page besides the band — scale, made visible. */}
          <div className="md:col-span-6 lg:col-span-4">
            <div className="relative aspect-4/5 w-full overflow-hidden">
              <Image
                src="/media/experience-port.jpg"
                alt="A container terminal running through the night, seen across the water."
                fill
                sizes="(min-width: 1024px) 30vw, (min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>

          <div className="md:col-span-6 lg:col-span-4">
            <h2
              id="leadership-heading"
              className="t-h2 max-w-[14ch] text-[color:var(--color-text-invert)]"
            >
              {leadership.heading}
            </h2>

            <p className="mt-10 flex items-baseline gap-3">
              <span className="t-numeral text-[color:var(--color-accent-invert)]">
                {leadership.headline.value}
              </span>
              <span className="t-eyebrow">{leadership.headline.unit}</span>
            </p>
            <p className="t-lead measure-tight mt-4">
              {leadership.headline.label}
            </p>
          </div>

          <ul className="lg:col-span-4 lg:col-start-9 md:col-span-6">
            {leadership.points.map((point, index) => (
              <li key={point} className="flex gap-6 border-t border-[color:var(--color-line-invert)] py-5 last:border-b">
                <span className="t-index pt-[0.35rem]">{pad2(index + 1)}</span>
                <p className="measure text-[color:var(--color-text-invert)]">
                  {point}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <p className="t-caption measure-tight mt-10 text-[color:var(--color-text-invert-muted)]">
          {leadership.qualification}
        </p>
      </div>
    </section>
  );
}

export function CaseStoriesSection() {
  return (
    <section className="section" aria-labelledby="case-stories-heading">
      <div className="content">
        <SectionHeader
          eyebrow={caseStories.eyebrow}
          heading={caseStories.heading}
          headingId="case-stories-heading"
        />

        <div className="mt-12 flex flex-col">
          {caseStories.items.map((story, index) => (
            <div key={story.id} className="border-t border-[color:var(--color-line)] py-9 last:border-b">
              <article className="grid12">
                <div className="md:col-span-6 lg:col-span-4">
                  <span className="t-index">{pad2(index + 1)}</span>
                  <h3 className="t-h3 mt-3 max-w-[16ch]">{story.name}</h3>
                </div>

                <dl className="lg:col-span-7 lg:col-start-6 md:col-span-6 flex flex-col gap-5">
                  <div>
                    <dt className="t-eyebrow">Situation</dt>
                    <dd className="measure mt-2">{story.situation}</dd>
                  </div>
                  <div>
                    <dt className="t-eyebrow">Intervention</dt>
                    <dd className="measure mt-2">{story.intervention}</dd>
                  </div>
                  <div>
                    <dt className="t-eyebrow">Result</dt>
                    <dd className="measure mt-2 font-serif text-[length:var(--text-h3)] leading-[1.3] tracking-[-0.015em]">
                      {story.result}
                    </dd>
                  </div>
                  <div>
                    <dt className="t-eyebrow">Why it matters</dt>
                    <dd className="measure mt-2 text-[color:var(--color-text-muted)]">
                      {story.why}
                    </dd>
                  </div>
                </dl>
              </article>
            </div>
          ))}
        </div>

        <p className="t-caption measure-tight mt-8 text-[color:var(--color-text-muted)]">
          {caseStories.qualification}
        </p>
      </div>
    </section>
  );
}

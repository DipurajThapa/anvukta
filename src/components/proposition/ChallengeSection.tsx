import { Eyebrow } from "@/components/ui/Marks";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { challenge, symptoms } from "@/content/home";
import { pad2 } from "@/lib/utils";

/**
 * Five boxes, one per link between intent and execution, plus a sixth cell
 * carrying the closing statement — so the grid resolves into two clean rows
 * instead of leaving an orphaned pair.
 */
export function ChallengeSection() {
  return (
    <section className="surface-warm section" aria-labelledby="challenge-heading">
      <div className="content">
        <SectionHeader
          eyebrow={challenge.eyebrow}
          heading={challenge.heading}
          lead={challenge.lead}
          headingId="challenge-heading"
        />

        <ul className="mt-12 grid gap-[var(--grid-gap)] sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">
          {challenge.links.map((link, index) => (
            <li key={link.name} className="flex flex-col border border-[color:var(--color-line-strong)] bg-[color:var(--color-paper)] p-7">
              <span
                aria-hidden="true"
                className="block h-[2px] w-[2.5rem] bg-[color:var(--color-accent)]"
              />
              <span className="t-index mt-5 block">
                {pad2(index + 1)} / {pad2(challenge.links.length)}
              </span>
              <h3 className="t-h3 mt-3">{link.name}</h3>
              <p className="mt-3 text-[color:var(--color-text-muted)]">
                {link.description}
              </p>
            </li>
          ))}

          <li className="surface-ink flex flex-col justify-center p-7">
            <p className="font-serif text-[length:var(--text-h3)] leading-[1.3] tracking-[-0.015em] text-[color:var(--color-text-invert)]">
              {challenge.close}
            </p>
          </li>
        </ul>
      </div>
    </section>
  );
}

export function SymptomsSection() {
  return (
    <section className="section" aria-labelledby="symptoms-heading">
      <div className="content">
        <div className="grid12">
          <div className="md:col-span-6 lg:col-span-4">
            <Eyebrow>{symptoms.eyebrow}</Eyebrow>
            <h2 id="symptoms-heading" className="t-h2 mt-5 max-w-[16ch]">
              {symptoms.heading}
            </h2>
            <p className="t-lead measure-tight mt-5">{symptoms.lead}</p>
          </div>

          <ul className="lg:col-span-7 lg:col-start-6 md:col-span-6">
            {symptoms.items.map((item, index) => (
              <li key={item} className="flex gap-6 border-t border-[color:var(--color-line)] py-5 last:border-b">
                <span className="t-index pt-[0.35rem]">{pad2(index + 1)}</span>
                <p className="measure text-[length:var(--text-body-lg)] leading-[1.5]">
                  {item}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <p className="t-caption mt-8 text-[color:var(--color-text-muted)]">
          {symptoms.note}
        </p>
      </div>
    </section>
  );
}

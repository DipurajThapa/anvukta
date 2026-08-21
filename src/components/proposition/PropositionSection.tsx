import { Icon, type IconName } from "@/components/ui/Icon";
import { Eyebrow } from "@/components/ui/Marks";
import { outcomes, proposition } from "@/content/home";
import { pad2 } from "@/lib/utils";

export function PropositionSection() {
  return (
    <section className="section" aria-labelledby="proposition-heading">
      <div className="content">
        <Eyebrow>{proposition.eyebrow}</Eyebrow>

        <h2 id="proposition-heading" className="t-h1 measure mt-6">
          {proposition.heading}
        </h2>

        <p className="t-lead mt-7 text-[length:var(--text-body-lg)]">
          {proposition.lead}
        </p>

        <ul className="grid12 mt-14">
          {proposition.principles.map((principle, index) => (
            <li key={principle.title} className="border-t-2 border-[color:var(--color-ink)] pt-6 md:col-span-2 lg:col-span-4">
              <span className="t-index">{pad2(index + 1)}</span>
              <h3 className="t-h3 mt-4">{principle.title}</h3>
              <p className="measure-tight mt-3 text-[color:var(--color-text-muted)]">
                {principle.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function OutcomesSection() {
  return (
    <section className="surface-ink section" aria-labelledby="outcomes-heading">
      <div className="content">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>{outcomes.eyebrow}</Eyebrow>
            <h2
              id="outcomes-heading"
              className="t-h2 mt-5 max-w-[18ch] text-[color:var(--color-text-invert)]"
            >
              {outcomes.heading}
            </h2>
          </div>
          <p className="t-caption max-w-[32ch] text-[color:var(--color-text-invert-muted)] md:text-right">
            {outcomes.note}
          </p>
        </div>

        <hr className="rule mt-10" />

        <dl className="grid12">
          {outcomes.items.map((item) => (
            <div key={item.name} className="border-b border-[color:var(--color-line-invert)] py-8 md:col-span-3 lg:col-span-4">
              <dt className="flex items-center gap-3 text-[color:var(--color-text-invert)]">
                <Icon
                  name={item.icon as IconName}
                  size="lg"
                  className="text-[color:var(--color-accent-invert)]"
                />
                <span className="t-h3">{item.name}</span>
              </dt>
              <dd className="measure-tight mt-3 text-[color:var(--color-text-invert-muted)]">
                {item.description}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

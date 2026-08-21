import Image from "next/image";
import Link from "next/link";

import { ContactChannelLinks } from "@/components/contact/ContactChannels";
import { Eyebrow } from "@/components/ui/Marks";
import { hero } from "@/content/home";

/**
 * First viewport: headline, positioning, action, and one photograph.
 *
 * The h1 is plain server-rendered text with no animation gate, so it paints in
 * the first frame. The photograph sits behind it at every width — full-bleed on
 * mobile under a heavy scrim, a right-hand plate on desktop — and is marked
 * priority because it is the largest thing above the fold.
 */
export function Hero() {
  return (
    <section className="surface-ink relative overflow-hidden" aria-labelledby="hero-heading">
      <div className="absolute inset-0 lg:left-[46%]">
        <Image
          src="/media/hero-facade.jpg"
          alt="Glass office towers seen from street level, their frames converging overhead."
          fill
          priority
          sizes="(min-width: 1024px) 60vw, 100vw"
          quality={62}
          className="object-cover object-[center_30%]"
        />
        {/* Two scrims: a vertical one for mobile, a horizontal one for desktop. */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,23,33,0.86)_0%,rgba(10,23,33,0.78)_55%,rgba(10,23,33,0.92)_100%)] lg:hidden" />
        <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,var(--color-ink)_0%,var(--color-ink)_10%,rgba(10,23,33,0.6)_46%,rgba(10,23,33,0.12)_100%)] lg:block" />
      </div>

      <div className="content relative pb-[var(--section-y)] pt-[calc(var(--header-h)+var(--section-y))]">
        <div className="grid12">
          <div className="md:col-span-6 lg:col-span-7">
            <Eyebrow>{hero.eyebrow}</Eyebrow>

            <h1 id="hero-heading" className="t-display mt-6 max-w-[14ch]">
              {hero.headline}
            </h1>

            <p className="t-lead measure-lead mt-8 text-[length:var(--text-body-lg)] text-[color:var(--color-text-invert)]">
              {hero.lead}
            </p>

            <p className="t-small measure-tight mt-5 text-[color:var(--color-text-invert-muted)]">
              {hero.support}
            </p>

            <div className="mt-10 flex flex-col items-start gap-7">
              <ContactChannelLinks tone="ink" />
              <Link href="/proposition#capabilities" className="btn btn-secondary">
                See what we do
              </Link>
            </div>
          </div>
        </div>
      </div>

      <hr className="rule-invert relative border-t" />
    </section>
  );
}

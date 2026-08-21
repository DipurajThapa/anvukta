import Image from "next/image";
import type { ReactNode } from "react";

import { Icon } from "@/components/ui/Icon";
import { cx, pad2 } from "@/lib/utils";

/**
 * Section breakers — the four dividers that give a long page a pulse.
 *
 * Rotate them: an image band at most twice per page, a chapter rule between
 * sibling sections, a statement band where one sentence carries weight, and a
 * step-down wherever the ground colour changes. Never two of the same in a row.
 */

/* -------------------------------------------------------------------------- */
/* A — image band                                                             */
/* -------------------------------------------------------------------------- */

export function ImageBandBreaker({
  src,
  alt,
  eyebrow,
  children,
  priority = false,
}: {
  src: string;
  /** Empty when the photograph is atmosphere rather than information. */
  alt: string;
  eyebrow?: string;
  children: ReactNode;
  priority?: boolean;
}) {
  return (
    <div className="surface-ink relative overflow-hidden">
      {/* Fixed aspect ratio at every width, so the band never shifts the page. */}
      <div className="relative h-[15rem] w-full sm:h-[17rem] lg:h-[21rem]">
        <Image
          src={src}
          alt={alt}
          fill
          sizes="100vw"
          quality={62}
          priority={priority}
          className="object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,23,33,0.94)_0%,rgba(10,23,33,0.7)_48%,rgba(10,23,33,0.2)_100%)]"
        />
        <div className="content relative flex h-full items-center">
          <div className="max-w-[46rem]">
            {eyebrow ? <p className="t-eyebrow">{eyebrow}</p> : null}
            <p className="t-h2 mt-4 text-[color:var(--color-text-invert)]">
              {children}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* B — chapter rule                                                           */
/* -------------------------------------------------------------------------- */

export function ChapterRule({
  index,
  label,
  tone = "paper",
}: {
  index: number;
  label: string;
  tone?: "paper" | "warm";
}) {
  return (
    <div className={cx(tone === "warm" && "surface-warm")} aria-hidden="true">
      <div className="content">
        <div className="flex items-center gap-5 py-7 sm:gap-6">
          <span className="t-numeral text-[length:var(--text-h2)] text-[color:var(--color-accent-text)]">
            {pad2(index)}
          </span>
          <span className="h-px flex-1 bg-[color:var(--color-line-strong)]" />
          <span className="t-label whitespace-nowrap text-[color:var(--color-text-muted)]">
            {label}
          </span>
          <span className="h-[2px] w-[2.5rem] bg-[color:var(--color-accent)] sm:w-[4rem]" />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* C — statement band                                                          */
/* -------------------------------------------------------------------------- */

export function StatementBreaker({
  children,
  attribution,
}: {
  children: ReactNode;
  attribution?: string;
}) {
  return (
    <div className="surface-warm section">
      <div className="content">
        <div className="flex items-start gap-6 sm:gap-8">
          <span
            aria-hidden="true"
            className="mt-2 block w-[3px] shrink-0 self-stretch bg-[color:var(--color-accent)]"
          />
          <div>
            <p className="t-h2 max-w-[24ch]">
              {children}
            </p>
            {attribution ? (
              <p className="t-caption mt-5 text-[color:var(--color-text-muted)]">
                {attribution}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* D — step-down                                                              */
/* -------------------------------------------------------------------------- */

export function StepDownBreaker({ next }: { next: string }) {
  return (
    <div
      aria-hidden="true"
      className="relative h-[7.5rem] bg-[linear-gradient(180deg,var(--color-ink)_0%,var(--color-ink)_50%,var(--color-paper-warm)_50%,var(--color-paper-warm)_100%)]"
    >
      <div className="content relative flex h-full items-center justify-between">
        <span className="grid h-[3rem] w-[3rem] place-items-center rounded-full bg-[color:var(--color-accent)] text-white sm:h-[3.5rem] sm:w-[3.5rem]">
          <Icon name="arrow-down" size="md" />
        </span>
        <span className="t-label text-[color:var(--color-text-invert-muted)]">
          {next}
        </span>
      </div>
    </div>
  );
}

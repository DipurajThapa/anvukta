import Link from "next/link";

import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/utils";

type ArrowLinkProps = {
  href: string;
  children: string;
  className?: string;
  /** Extra context for screen readers when the label alone is ambiguous. */
  describedAs?: string;
};

/** Motif 2 — uppercase label paired with a filled circular arrow. */
export function ArrowLink({
  href,
  children,
  className,
  describedAs,
}: ArrowLinkProps) {
  return (
    <Link href={href} className={cx("btn-arrow", className)}>
      <span>{children}</span>
      {describedAs ? <span className="sr-only">{describedAs}</span> : null}
      <span className="btn-arrow__circle" aria-hidden="true">
        <Icon name="arrow-right" size="md" />
      </span>
    </Link>
  );
}

export function TextArrowLink({
  href,
  children,
  className,
}: {
  href: string;
  children: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cx(
        // min-h-[2.75rem] keeps the target at 44px: WCAG 2.2 AA asks 24px, and this is a
        // standalone link rather than one inside a sentence, so the exception
        // for inline text links does not apply.
        "group inline-flex min-h-[2.75rem] items-center gap-3 py-1 text-[length:var(--text-button)] font-medium uppercase tracking-[0.1em]",
        className,
      )}
    >
      <span>{children}</span>
      <Icon
        name="arrow-right"
        size="sm"
        className="transition-transform duration-200 ease-out group-hover:translate-x-1"
      />
    </Link>
  );
}

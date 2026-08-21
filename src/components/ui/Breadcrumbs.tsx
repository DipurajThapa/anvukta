import Link from "next/link";

import { Icon } from "@/components/ui/Icon";
import { absoluteUrl } from "@/lib/site";
import { cx } from "@/lib/utils";

export type Crumb = {
  label: string;
  /** Omitted on the final crumb, which is the current page. */
  href?: string;
};

/**
 * One breadcrumb trail for the whole site, so every page below the top level
 * looks and behaves the same.
 *
 * Home is always the first step and is added here, so callers only pass the
 * steps below it. Deeper pages pass their parent too, which is what makes an
 * article read "Home / Insights / AI Transformation / This article" rather than
 * jumping straight from Home to the article.
 */
export function Breadcrumbs({
  trail,
  tone = "ink",
  className,
}: {
  trail: Crumb[];
  /** "ink" sits on a dark header band; "paper" on a light one. */
  tone?: "ink" | "paper";
  className?: string;
}) {
  const steps: Crumb[] = [{ label: "Home", href: "/" }, ...trail];

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol
        className={cx(
          "t-caption flex flex-wrap items-center gap-x-2 gap-y-1",
          tone === "ink"
            ? "text-[color:var(--color-text-invert-muted)]"
            : "text-[color:var(--color-text-muted)]",
        )}
      >
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;

          return (
            <li key={step.label} className="flex items-center gap-2">
              {index > 0 ? (
                <Icon name="chevron-right" size="xs" className="opacity-50" />
              ) : null}

              {isLast || !step.href ? (
                <span
                  aria-current="page"
                  className={cx(
                    "max-w-[26ch] truncate",
                    tone === "ink"
                      ? "text-[color:var(--color-text-invert)]"
                      : "text-[color:var(--color-text)]",
                  )}
                >
                  {step.label}
                </span>
              ) : (
                <Link
                  href={step.href}
                  className="inline-flex min-h-[2rem] items-center underline decoration-transparent underline-offset-4 transition-colors duration-150 hover:decoration-current"
                >
                  {step.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** The matching BreadcrumbList for structured data, built from the same trail. */
export function breadcrumbJsonLd(trail: Crumb[], currentUrl: string) {
  const steps: Crumb[] = [{ label: "Home", href: "/" }, ...trail];

  return {
    "@type": "BreadcrumbList",
    itemListElement: steps.map((step, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: step.label,
      item: step.href ? absoluteUrl(step.href) : currentUrl,
    })),
  };
}

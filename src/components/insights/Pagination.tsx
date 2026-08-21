import Link from "next/link";

import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/utils";

type PaginationProps = {
  page: number;
  totalPages: number;
  /** Query values to preserve across page links. */
  params: Record<string, string | undefined>;
};

function hrefFor(page: number, params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query ? `/blog?${query}` : "/blog";
}

export function Pagination({ page, totalPages, params }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav aria-label="Insights pagination" className="mt-14">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        <li>
          {page > 1 ? (
            <Link
              href={hrefFor(page - 1, params)}
              rel="prev"
              className="btn btn-secondary min-w-[2.75rem] gap-2 px-4"
            >
              <Icon name="chevron-left" size="sm" />
              Previous
            </Link>
          ) : (
            <span className="btn btn-secondary min-w-[2.75rem] px-4" aria-disabled="true">
              Previous
            </span>
          )}
        </li>

        {pages.map((value) => (
          <li key={value}>
            <Link
              href={hrefFor(value, params)}
              aria-current={value === page ? "page" : undefined}
              aria-label={`Page ${value}`}
              className={cx(
                "grid h-[2.75rem] min-w-[2.75rem] place-items-center border px-3 text-[length:var(--text-small)] transition-colors duration-150",
                value === page
                  ? "border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-[color:var(--color-text-invert)]"
                  : "border-[color:var(--color-line-strong)] hover:border-[color:var(--color-text)]",
              )}
            >
              {value}
            </Link>
          </li>
        ))}

        <li>
          {page < totalPages ? (
            <Link
              href={hrefFor(page + 1, params)}
              rel="next"
              className="btn btn-secondary min-w-[2.75rem] gap-2 px-4"
            >
              Next
              <Icon name="chevron-right" size="sm" />
            </Link>
          ) : (
            <span className="btn btn-secondary min-w-[2.75rem] px-4" aria-disabled="true">
              Next
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}

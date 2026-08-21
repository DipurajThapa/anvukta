import Link from "next/link";

import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/utils";

type Filter = { name: string; slug: string; count: number };

function buildHref(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `/blog?${query}` : "/blog";
}

/**
 * Search is a plain GET form: it works with JavaScript disabled, produces a
 * shareable URL, and needs no client-side JavaScript at all.
 */
export function InsightsFilters({
  categories,
  tags,
  activeCategory,
  activeTag,
  search,
}: {
  categories: Filter[];
  tags: Filter[];
  activeCategory?: string;
  activeTag?: string;
  search?: string;
}) {
  const hasFilters = Boolean(activeCategory || activeTag || search);

  return (
    <div className="flex flex-col gap-10">
      <form
        action="/blog"
        method="get"
        role="search"
        className="flex w-full flex-col gap-3 sm:flex-row sm:items-end lg:max-w-xl"
      >
        <div className="field flex-1">
          <label className="field__label" htmlFor="insights-search">
            Search insights
          </label>
          <div className="relative">
            <Icon
              name="search"
              size="md"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--color-text-muted)]"
            />
            <input
              id="insights-search"
              name="q"
              type="search"
              defaultValue={search ?? ""}
              placeholder="Search by topic"
              className="field__control pl-11"
              autoComplete="off"
            />
          </div>
        </div>
        {activeCategory ? (
          <input type="hidden" name="category" value={activeCategory} />
        ) : null}
        {activeTag ? <input type="hidden" name="tag" value={activeTag} /> : null}
        <button type="submit" className="btn btn-primary gap-2 sm:w-auto">
          <Icon name="search" size="sm" />
          Search
        </button>
      </form>

      <div className="grid gap-10 lg:grid-cols-2">
      {categories.length > 0 ? (
        <nav aria-label="Filter by category">
          <h2 className="t-eyebrow">Categories</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            <li>
              <Link
                href={buildHref({ q: search, tag: activeTag })}
                className={cx("pill", !activeCategory && "pill--active")}
                aria-current={!activeCategory ? "true" : undefined}
              >
                All
              </Link>
            </li>
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={buildHref({
                    q: search,
                    tag: activeTag,
                    category: category.slug,
                  })}
                  className={cx(
                    "pill",
                    activeCategory === category.slug && "pill--active",
                  )}
                  aria-current={
                    activeCategory === category.slug ? "true" : undefined
                  }
                >
                  {category.name}
                  <span className="ml-2 opacity-70">{category.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {tags.length > 0 ? (
        <nav aria-label="Filter by tag">
          <h2 className="t-eyebrow">Tags</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li key={tag.slug}>
                <Link
                  href={buildHref({
                    q: search,
                    category: activeCategory,
                    tag: activeTag === tag.slug ? undefined : tag.slug,
                  })}
                  className={cx("pill", activeTag === tag.slug && "pill--active")}
                  aria-current={activeTag === tag.slug ? "true" : undefined}
                >
                  {tag.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      </div>

      {hasFilters ? (
        <p className="t-small">
          <Link href="/blog" className="link">
            Clear all filters
          </Link>
        </p>
      ) : null}
    </div>
  );
}

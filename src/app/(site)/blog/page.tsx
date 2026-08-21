import type { Metadata } from "next";
import Link from "next/link";

import { cx } from "@/lib/utils";
import { InsightsFilters } from "@/components/insights/InsightsFilters";
import { Pagination } from "@/components/insights/Pagination";
import { FeaturedPostCard, PostCardItem } from "@/components/insights/PostCard";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/ui/Breadcrumbs";
import { Eyebrow } from "@/components/ui/Marks";
import {
  getPublicCategories,
  getPublicTags,
  getPublishedPosts,
} from "@/lib/posts";
import { jsonLdScript } from "@/lib/seo";
import { absoluteUrl, site } from "@/lib/site";

const TITLE = "Insights";
const DESCRIPTION =
  "Practical writing on business transformation, technology decisions and AI adoption, for the leaders who have to act on it rather than admire it.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: absoluteUrl("/blog"),
    types: { "application/rss+xml": absoluteUrl("/feed.xml") },
  },
  openGraph: {
    type: "website",
    url: absoluteUrl("/blog"),
    title: `${TITLE} | ${site.name}`,
    description: DESCRIPTION,
    images: [{ url: site.ogImagePath, width: 1200, height: 630, alt: site.name }],
  },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstValue(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const search = firstValue(params["q"]);
  const category = firstValue(params["category"]);
  const tag = firstValue(params["tag"]);
  const pageParam = Number.parseInt(firstValue(params["page"]) ?? "1", 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const isFiltered = Boolean(search || category || tag);

  const [{ posts, total, totalPages }, categories, tags] = await Promise.all([
    getPublishedPosts({ page, search, category, tag }),
    getPublicCategories(),
    getPublicTags(),
  ]);

  // The featured slot only makes sense on an unfiltered first page.
  const featured = !isFiltered && page === 1 ? posts[0] : undefined;
  const gridPosts = featured ? posts.slice(1) : posts;

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@graph": [breadcrumbJsonLd([{ label: "Insights" }], absoluteUrl("/blog")), {
    "@type": "Blog",
    "@id": absoluteUrl("/blog#blog"),
    name: `${TITLE} | ${site.name}`,
    description: DESCRIPTION,
    url: absoluteUrl("/blog"),
    inLanguage: "en",
    publisher: { "@id": absoluteUrl("/#organization") },
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: absoluteUrl(`/blog/${post.slug}`),
      datePublished: post.publishedAt?.toISOString(),
    })),
  }],
  };

  return (
    <>
      <div className="surface-ink pb-14 pt-[calc(var(--header-h)+3.5rem)]">
        <div className="content">
          <Breadcrumbs trail={[{ label: "Insights" }]} />

          <Eyebrow className="mt-8">Insights</Eyebrow>
          <h1 className="t-h1 mt-5 max-w-[18ch] text-[color:var(--color-text-invert)]">
            Thinking on transformation, technology and AI.
          </h1>
          <p className="t-lead measure mt-5">{DESCRIPTION}</p>
          <p className="t-small mt-5 text-[color:var(--color-text-invert-muted)]">
            Would rather see how we work than read about it?{" "}
            <Link href="/proposition" className="link">
              Read our proposition
            </Link>
            .
          </p>
        </div>
      </div>

      <div className="content section">
        <div>
          <div aria-label="Insights filters">
            <InsightsFilters
              categories={categories}
              tags={tags}
              activeCategory={category}
              activeTag={tag}
              search={search}
            />
          </div>

          <div className="mt-12 border-t border-[color:var(--color-line)] pt-6">
            <p className="t-caption text-[color:var(--color-text-muted)]" role="status">
              {total === 0
                ? "No articles found"
                : `${total} article${total === 1 ? "" : "s"}${
                    isFiltered ? " matching your filters" : ""
                  }`}
            </p>

            {total === 0 ? (
              <div className="mt-8 border-t border-[color:var(--color-line)] pt-8">
                <h2 className="t-h3">Nothing here yet</h2>
                <p className="measure mt-3 text-[color:var(--color-text-muted)]">
                  {isFiltered
                    ? "No published article matches that search. Try a broader term, or clear the filters."
                    : "The first Insights articles are being prepared. In the meantime, a conversation is often faster than an article."}
                </p>
                <div className="mt-6 flex flex-wrap gap-4">
                  {isFiltered ? (
                    <Link href="/blog" className="btn btn-secondary">
                      Clear filters
                    </Link>
                  ) : null}
                  <Link href="/contact" className="btn btn-primary">
                    Talk to us
                  </Link>
                </div>
              </div>
            ) : null}

            {featured ? (
              <div className="mt-8">
                <FeaturedPostCard post={featured} />
              </div>
            ) : null}

            {gridPosts.length > 0 ? (
              <ul
                className={cx(
                  "mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2",
                  // Match the columns to what there is to show. Three columns
                  // holding two articles leaves a hole where the third would be.
                  gridPosts.length % 3 === 0 ? "lg:grid-cols-3" : "lg:grid-cols-2",
                )}
              >
                {gridPosts.map((post) => (
                  <li key={post.id}>
                    <PostCardItem post={post} />
                  </li>
                ))}
              </ul>
            ) : null}

            <Pagination
              page={page}
              totalPages={totalPages}
              params={{ q: search, category, tag }}
            />
          </div>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(blogJsonLd) }}
      />
    </>
  );
}

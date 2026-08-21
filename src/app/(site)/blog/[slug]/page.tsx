import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleMedia } from "@/components/insights/ArticleMedia";
import { Icon } from "@/components/ui/Icon";
import { PostCardItem } from "@/components/insights/PostCard";
import { ContactChannelLinks } from "@/components/contact/ContactChannels";
import { Breadcrumbs, breadcrumbJsonLd, type Crumb } from "@/components/ui/Breadcrumbs";
import { renderMarkdown } from "@/lib/markdown";
import {
  getAllPublishedSlugs,
  getPostBySlug,
  getRelatedPosts,
} from "@/lib/posts";
import { jsonLdScript } from "@/lib/seo";
import { absoluteUrl, site } from "@/lib/site";
import { formatDate, isoDate, truncate } from "@/lib/utils";

type Params = Promise<{ slug: string }>;

/**
 * Prebuilds a page per published article.
 *
 * The build runs this against the database, and on a hosting platform the
 * database is not always reachable at build time. Rather than fail the whole
 * deployment over it, fall back to an empty list: the articles then render on
 * first request instead of ahead of time, which is slower once and correct.
 */
export async function generateStaticParams() {
  try {
    const posts = await getAllPublishedSlugs();
    return posts.map((post) => ({ slug: post.slug }));
  } catch (error) {
    console.warn("[build] could not reach the database, articles will render on demand", {
      reason: error instanceof Error ? error.message : "unknown",
    });
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return { title: "Article not found", robots: { index: false, follow: false } };
  }

  const url = post.canonicalUrl ?? absoluteUrl(`/blog/${post.slug}`);
  const description = post.seoDescription ?? truncate(post.excerpt, 158);
  const ogImage = post.ogImage ?? site.ogImagePath;

  return {
    title: post.seoTitle ?? post.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.seoTitle ?? post.title,
      description,
      publishedTime: isoDate(post.publishedAt),
      modifiedTime: isoDate(post.updatedAt),
      authors: post.author ? [post.author.name] : undefined,
      section: post.category?.name,
      tags: post.tags.map((tag) => tag.name),
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.seoTitle ?? post.title,
      description,
      images: [ogImage],
    },
  };
}

export default async function ArticlePage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  // Home / Insights / Category / This article, so a reader landing from search
  // can see where they are and step back up one level at a time.
  const trail: Crumb[] = [
    { label: "Insights", href: "/blog" },
    ...(post.category
      ? [{ label: post.category.name, href: `/blog?category=${post.category.slug}` }]
      : []),
    { label: post.title },
  ];

  const { html, headings } = renderMarkdown(post.content);
  const related = await getRelatedPosts(post.slug, post.category?.slug ?? null);
  const canonical = post.canonicalUrl ?? absoluteUrl(`/blog/${post.slug}`);

  const graph = [
    {
      "@type": "BlogPosting",
      "@id": `${canonical}#article`,
      headline: post.title,
      description: post.seoDescription ?? post.excerpt,
      url: canonical,
      mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
      datePublished: isoDate(post.publishedAt),
      dateModified: isoDate(post.updatedAt),
      inLanguage: "en",
      wordCount: post.content.split(/\s+/).filter(Boolean).length,
      articleSection: post.category?.name,
      keywords: post.tags.map((tag) => tag.name).join(", ") || undefined,
      publisher: { "@id": absoluteUrl("/#organization") },
      ...(post.author ? { author: { "@type": "Person", name: post.author.name } } : {}),
    },
    breadcrumbJsonLd(trail, canonical),
  ];

  return (
    <>
      <article>
        <header className="surface-ink pb-[var(--section-y)] pt-[calc(var(--header-h)+var(--section-y))]">
          <div className="content">
            <Breadcrumbs trail={trail} />

            <div className="grid12 mt-10">
              <div className="lg:col-span-8 md:col-span-6">
                {post.category ? (
                  <p className="t-eyebrow">{post.category.name}</p>
                ) : null}

                <h1 className="t-h1 mt-5 text-[color:var(--color-text-invert)]">
                  {post.title}
                </h1>

                <p className="t-lead measure mt-6">{post.excerpt}</p>

                <dl className="t-caption mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[color:var(--color-text-invert-muted)]">
                  {post.author ? (
                    <div className="flex gap-2">
                      <dt className="sr-only">Author</dt>
                      <dd>{post.author.name}</dd>
                    </div>
                  ) : null}
                  <div className="flex gap-2">
                    <dt className="sr-only">Published</dt>
                    <dd className="inline-flex items-center gap-1.5">
                      <Icon name="calendar" size="xs" />
                      <time dateTime={isoDate(post.publishedAt)}>
                        {formatDate(post.publishedAt)}
                      </time>
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="sr-only">Reading time</dt>
                    <dd className="inline-flex items-center gap-1.5">
                      <Icon name="clock" size="xs" />
                      {post.readingMinutes} min read
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </header>

        <div className="content section">
          <div className="grid12">
            <div className="lg:col-span-8 md:col-span-6">
              <ArticleMedia
                src={post.heroImage}
                poster={post.heroPoster}
                alt={post.heroImageAlt}
                slug={post.slug}
                className="mb-12"
                priority
              />

              {/* Rendered from Markdown and sanitised on the server. */}
              <div
                className="prose measure"
                dangerouslySetInnerHTML={{ __html: html }}
              />

              {post.tags.length > 0 ? (
                <div className="mt-12 border-t border-[color:var(--color-line)] pt-6">
                  <h2 className="t-eyebrow">Tags</h2>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <li key={tag.slug}>
                        <Link href={`/blog?tag=${tag.slug}`} className="pill gap-1.5">
                          <Icon name="tag" size="xs" />
                          {tag.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <p className="t-caption mt-8 text-[color:var(--color-text-muted)]">
                Last updated{" "}
                <time dateTime={isoDate(post.updatedAt)}>
                  {formatDate(post.updatedAt)}
                </time>
                .
              </p>
            </div>

            {headings.length > 2 ? (
              <aside
                className="lg:col-span-3 lg:col-start-10 md:col-span-6"
                aria-labelledby="toc-heading"
              >
                <div className="lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
                  <h2 id="toc-heading" className="t-eyebrow">
                    On this page
                  </h2>
                  <nav aria-labelledby="toc-heading" className="mt-4">
                    <ul className="flex flex-col gap-3 border-l border-[color:var(--color-line)] pl-4">
                      {headings.map((heading) => (
                        <li
                          key={heading.id}
                          className={heading.level === 3 ? "pl-4" : undefined}
                        >
                          <a
                            href={`#${heading.id}`}
                            className="t-small text-[color:var(--color-text-muted)] transition-colors duration-150 hover:text-[color:var(--color-text)]"
                          >
                            {heading.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>
              </aside>
            ) : null}
          </div>
        </div>
      </article>

      {related.length > 0 ? (
        <section className="surface-warm section" aria-labelledby="related-heading">
          <div className="content">
            <h2 id="related-heading" className="t-h2">
              Related insights
            </h2>
            <hr className="rule mt-8" />
            <ul className="grid12 mt-10">
              {related.map((item) => (
                <li key={item.id} className="md:col-span-3 lg:col-span-4">
                  <PostCardItem post={item} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="surface-ink section" aria-labelledby="article-cta-heading">
        <div className="content flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2
              id="article-cta-heading"
              className="t-h2 max-w-[18ch] text-[color:var(--color-text-invert)]"
            >
              Want to test this against your own position?
            </h2>
            <p className="t-lead measure-lead mt-4">
              A 60-minute executive discovery session identifies the highest-value
              constraint and whether a diagnostic is justified.
            </p>
          </div>
          <ContactChannelLinks tone="ink" className="shrink-0" />
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript({ "@context": "https://schema.org", "@graph": graph }),
        }}
      />
    </>
  );
}

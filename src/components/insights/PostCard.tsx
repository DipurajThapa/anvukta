import Image from "next/image";
import Link from "next/link";

import { ArtCover } from "@/components/art/ArtCover";
import { Icon } from "@/components/ui/Icon";
import type { PostCard } from "@/lib/posts";
import { cx, formatDate, isoDate } from "@/lib/utils";

/**
 * Every cover sits in the same 3:2 box whether it holds a photograph or the
 * drawn fallback, so a row of cards lines up even when only some have artwork.
 */
function Cover({
  post,
  sizes,
  priority,
  className,
}: {
  post: PostCard;
  sizes: string;
  priority?: boolean;
  /** Lets the featured cover fill the height of the row instead of floating in it. */
  className?: string;
}) {
  return (
    <div
      className={cx(
        "relative aspect-3/2 overflow-hidden bg-[color:var(--color-ink)]",
        className,
      )}
    >
      {post.heroImage ? (
        <Image
          src={post.heroImage}
          alt={post.heroImageAlt ?? ""}
          fill
          sizes={sizes}
          quality={62}
          priority={priority}
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
      ) : (
        <ArtCover
          seed={post.slug}
          className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
      )}
    </div>
  );
}

/**
 * Date, reading time and category on one line.
 *
 * The category leads because it is what a reader scans for; it is a plain span
 * rather than a link so the whole card can stay a single target.
 */
function PostMeta({ post, invert }: { post: PostCard; invert?: boolean }) {
  return (
    <p
      className={cx(
        "t-caption flex flex-wrap items-center gap-x-4 gap-y-1",
        invert
          ? "text-[color:var(--color-text-invert-muted)]"
          : "text-[color:var(--color-text-muted)]",
      )}
    >
      {post.category ? (
        <span className="t-label text-[color:var(--color-accent-text)]">
          {post.category.name}
        </span>
      ) : null}
      <span className="inline-flex items-center gap-1.5">
        <Icon name="calendar" size="xs" />
        <time dateTime={isoDate(post.publishedAt)}>{formatDate(post.publishedAt)}</time>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Icon name="clock" size="xs" />
        {post.readingMinutes} min read
      </span>
    </p>
  );
}

/** Standard Insights card. The whole card is one link target. */
export function PostCardItem({ post }: { post: PostCard }) {
  return (
    <article className="group h-full">
      <Link
        href={`/blog/${post.slug}`}
        className="flex h-full flex-col border-t border-[color:var(--color-line)] pt-5"
      >
        <Cover post={post} sizes="(min-width: 64rem) 30vw, (min-width: 48rem) 45vw, 92vw" />

        <div className="mt-5 flex flex-1 flex-col">
          <PostMeta post={post} />
          {/* Fixed at h4 so a long title cannot tower over its neighbours. */}
          <h3 className="t-h4 mt-3 text-balance group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">
            {post.title}
          </h3>
          <p className="t-small mt-3 line-clamp-4 text-[color:var(--color-text-muted)]">
            {post.excerpt}
          </p>
          <span className="t-action mt-5 inline-flex items-center gap-2 text-[color:var(--color-accent-text)]">
            Read
            <Icon
              name="arrow-right"
              size="sm"
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </span>
        </div>
      </Link>
    </article>
  );
}

/**
 * The lead article, given a wider composition than the rest.
 *
 * The heading is capped at h2. At h1 a long title in a half-width column pushed
 * single words past their edge and they ran underneath the picture.
 */
export function FeaturedPostCard({ post }: { post: PostCard }) {
  return (
    <article className="group">
      <Link
        href={`/blog/${post.slug}`}
        className="grid items-stretch gap-8 border-t-2 border-[color:var(--color-ink)] pt-8 lg:grid-cols-2 lg:gap-12"
      >
        <Cover
          post={post}
          sizes="(min-width: 64rem) 46vw, 92vw"
          priority
          className="lg:aspect-auto lg:h-full lg:min-h-[26rem]"
        />

        <div className="flex flex-col justify-center">
          <p className="t-eyebrow">Featured</p>
          <h2 className="t-h3 mt-4 text-balance hyphens-auto group-hover:underline group-hover:decoration-1 group-hover:underline-offset-[6px]">
            {post.title}
          </h2>
          <p className="t-lead measure mt-5 text-[color:var(--color-text-muted)]">
            {post.excerpt}
          </p>
          <div className="mt-6">
            <PostMeta post={post} />
          </div>
          <span className="t-action mt-6 inline-flex items-center gap-2 text-[color:var(--color-accent-text)]">
            Read the article
            <Icon
              name="arrow-right"
              size="sm"
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </span>
        </div>
      </Link>
    </article>
  );
}

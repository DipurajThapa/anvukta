import "server-only";

import { prisma } from "@/lib/db";

/**
 * A search term is matched with LIKE against full article bodies, which is a
 * scan the caller controls the size of. Long terms find nothing useful anyway.
 */
const MAX_SEARCH_TERM = 100;

export const POSTS_PER_PAGE = 6;

/**
 * One shared selection shape for every public post query.
 * Fetching tags/category in the same round-trip avoids N+1 lookups when a list
 * of cards renders their metadata.
 */
const postCardSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  heroImage: true,
  heroImageAlt: true,
  heroPoster: true,
  publishedAt: true,
  updatedAt: true,
  readingMinutes: true,
  category: { select: { name: true, slug: true } },
  tags: { select: { tag: { select: { name: true, slug: true } } } },
} as const;

const postDetailSelect = {
  ...postCardSelect,
  content: true,
  seoTitle: true,
  seoDescription: true,
  canonicalUrl: true,
  ogImage: true,
  createdAt: true,
  author: { select: { name: true } },
} as const;

export type PostCard = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  heroImage: string | null;
  heroImageAlt: string | null;
  heroPoster: string | null;
  publishedAt: Date | null;
  updatedAt: Date;
  readingMinutes: number;
  category: { name: string; slug: string } | null;
  tags: { name: string; slug: string }[];
};

export type PostDetail = PostCard & {
  content: string;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  ogImage: string | null;
  createdAt: Date;
  author: { name: string } | null;
};

type RawTags = { tags: { tag: { name: string; slug: string } }[] };

function flattenTags<T extends RawTags>(post: T): Omit<T, "tags"> & {
  tags: { name: string; slug: string }[];
} {
  const { tags, ...rest } = post;
  return { ...rest, tags: tags.map((entry) => entry.tag) };
}

/** Only published posts, and never one dated in the future. */
const publishedWhere = () =>
  ({
    status: "published",
    publishedAt: { not: null, lte: new Date() },
  }) as const;

export type PostQuery = {
  page?: number;
  category?: string;
  tag?: string;
  search?: string;
  excludeSlug?: string;
};

/**
 * Runs a read that the build needs, and gives way if the database is not there.
 *
 * Pages like the home page and the Insights index are prerendered, so the build
 * reads the database. A hosting platform often builds before the database is
 * reachable, and without this the whole deployment fails on a connection error.
 *
 * This only softens the BUILD. At runtime the error is thrown as normal, because
 * a live site quietly pretending it has no articles would hide a real outage.
 */
async function readForBuild<T>(read: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await read();
  } catch (error) {
    const building = process.env.NEXT_PHASE === "phase-production-build";
    if (!building) throw error;

    console.warn("[build] database unavailable, this page will render on demand", {
      reason: error instanceof Error ? error.message : "unknown",
    });
    return fallback;
  }
}

export async function getPublishedPosts(query: PostQuery = {}): Promise<{
  posts: PostCard[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const page = Math.max(1, Math.trunc(query.page ?? 1));
  const search = query.search?.trim();

  const where = {
    ...publishedWhere(),
    ...(query.category ? { category: { slug: query.category } } : {}),
    ...(query.tag ? { tags: { some: { tag: { slug: query.tag } } } } : {}),
    ...(query.excludeSlug ? { slug: { not: query.excludeSlug } } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search.slice(0, MAX_SEARCH_TERM) } },
            { excerpt: { contains: search.slice(0, MAX_SEARCH_TERM) } },
            { content: { contains: search.slice(0, MAX_SEARCH_TERM) } },
          ],
        }
      : {}),
  };

  const read = () =>
    Promise.all([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        select: postCardSelect,
        orderBy: { publishedAt: "desc" },
        skip: (page - 1) * POSTS_PER_PAGE,
        take: POSTS_PER_PAGE,
      }),
    ]);

  const empty: Awaited<ReturnType<typeof read>> = [0, []];
  const [total, posts] = await readForBuild(read, empty);

  return {
    posts: posts.map(flattenTags),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / POSTS_PER_PAGE)),
  };
}

export async function getFeaturedPost(): Promise<PostCard | null> {
  const post = await readForBuild(
    () =>
      prisma.post.findFirst({
        where: publishedWhere(),
        select: postCardSelect,
        orderBy: { publishedAt: "desc" },
      }),
    null,
  );
  return post ? flattenTags(post) : null;
}

export async function getPostBySlug(slug: string): Promise<PostDetail | null> {
  const post = await prisma.post.findFirst({
    where: { slug, ...publishedWhere() },
    select: postDetailSelect,
  });
  return post ? flattenTags(post) : null;
}

/** Related posts: same category first, then most recent, never the post itself. */
export async function getRelatedPosts(
  slug: string,
  categorySlug: string | null,
  limit = 3,
): Promise<PostCard[]> {
  const sameCategory = categorySlug
    ? await prisma.post.findMany({
        where: {
          ...publishedWhere(),
          slug: { not: slug },
          category: { slug: categorySlug },
        },
        select: postCardSelect,
        orderBy: { publishedAt: "desc" },
        take: limit,
      })
    : [];

  if (sameCategory.length >= limit) return sameCategory.map(flattenTags);

  const fillerNeeded = limit - sameCategory.length;
  const filler = await prisma.post.findMany({
    where: {
      ...publishedWhere(),
      slug: { not: slug },
      id: { notIn: sameCategory.map((post) => post.id) },
    },
    select: postCardSelect,
    orderBy: { publishedAt: "desc" },
    take: fillerNeeded,
  });

  return [...sameCategory, ...filler].map(flattenTags);
}

export async function getAllPublishedSlugs(): Promise<
  { slug: string; updatedAt: Date; publishedAt: Date | null }[]
> {
  return readForBuild(
    () =>
      prisma.post.findMany({
        where: publishedWhere(),
        select: { slug: true, updatedAt: true, publishedAt: true },
        orderBy: { publishedAt: "desc" },
      }),
    [],
  );
}

/** Categories that actually have at least one published post. */
export async function getPublicCategories(): Promise<
  { name: string; slug: string; count: number }[]
> {
  const categories = await readForBuild(
    () =>
      prisma.category.findMany({
        select: {
          name: true,
          slug: true,
          _count: { select: { posts: { where: publishedWhere() } } },
        },
        orderBy: { name: "asc" },
      }),
    [],
  );

  return categories
    .map(({ name, slug, _count }) => ({ name, slug, count: _count.posts }))
    .filter((category) => category.count > 0);
}

export async function getPublicTags(): Promise<
  { name: string; slug: string; count: number }[]
> {
  const tags = await readForBuild(
    () =>
      prisma.tag.findMany({
        select: {
          name: true,
          slug: true,
          _count: { select: { posts: { where: { post: publishedWhere() } } } },
        },
        orderBy: { name: "asc" },
      }),
    [],
  );

  return tags
    .map(({ name, slug, _count }) => ({ name, slug, count: _count.posts }))
    .filter((tag) => tag.count > 0);
}

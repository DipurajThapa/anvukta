import type { Metadata } from "next";
import Link from "next/link";

import {
  createCategory,
  deleteCategory,
  deleteTag,
  setPostStatus,
} from "@/app/actions/admin";
import { prisma } from "@/lib/db";
import { cx, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Insights" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && raw.trim().length > 0 ? raw.trim() : undefined;
}

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const statusFilter = first(params["status"]);
  const search = first(params["q"]);
  const deleted = first(params["deleted"]) === "1";

  const where = {
    ...(statusFilter === "draft" || statusFilter === "published"
      ? { status: statusFilter }
      : {}),
    ...(search
      ? { OR: [{ title: { contains: search } }, { slug: { contains: search } }] }
      : {}),
  };

  const [posts, categories, tags] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        publishedAt: true,
        updatedAt: true,
        category: { select: { name: true } },
      },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, _count: { select: { posts: true } } },
    }),
    prisma.tag.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, _count: { select: { posts: true } } },
    }),
  ]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="t-h2">Insights</h1>
        <Link href="/admin/blog/new" className="btn btn-primary">
          New article
        </Link>
      </div>

      {deleted ? (
        <p
          role="status"
          className="mt-6 border-l-2 border-[color:var(--color-success)] bg-[color:var(--color-paper-warm)] p-4 text-[length:var(--text-small)] font-medium text-[color:var(--color-success)]"
        >
          Article deleted.
        </p>
      ) : null}

      <form
        action="/admin/blog"
        method="get"
        role="search"
        className="mt-8 flex flex-wrap items-end gap-4"
      >
        <div className="field min-w-[16rem] flex-1">
          <label className="field__label" htmlFor="admin-search">
            Search
          </label>
          <input
            id="admin-search"
            name="q"
            type="search"
            defaultValue={search ?? ""}
            className="field__control"
            placeholder="Title or slug"
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="admin-status">
            Status
          </label>
          <select
            id="admin-status"
            name="status"
            defaultValue={statusFilter ?? ""}
            className="field__control"
          >
            <option value="">All</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <button type="submit" className="btn btn-secondary">
          Apply
        </button>
      </form>

      {posts.length === 0 ? (
        <div className="mt-10 border-t border-[color:var(--color-line)] pt-8">
          <h2 className="t-h3">No articles here</h2>
          <p className="mt-3 text-[color:var(--color-text-muted)]">
            {search || statusFilter
              ? "Nothing matches those filters."
              : "Nothing has been written yet."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {search || statusFilter ? (
              <Link href="/admin/blog" className="btn btn-secondary">
                Clear filters
              </Link>
            ) : null}
            <Link href="/admin/blog/new" className="btn btn-primary">
              New article
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[46rem] border-collapse text-left">
            <caption className="sr-only">
              All Insights articles, most recently edited first
            </caption>
            <thead>
              <tr className="border-b border-[color:var(--color-line-strong)]">
                <th scope="col" className="t-label py-3 pr-4 text-[color:var(--color-text-muted)]">
                  Title
                </th>
                <th scope="col" className="t-label py-3 pr-4 text-[color:var(--color-text-muted)]">
                  Status
                </th>
                <th scope="col" className="t-label py-3 pr-4 text-[color:var(--color-text-muted)]">
                  Category
                </th>
                <th scope="col" className="t-label py-3 pr-4 text-[color:var(--color-text-muted)]">
                  Published
                </th>
                <th scope="col" className="t-label py-3 pr-4 text-[color:var(--color-text-muted)]">
                  Updated
                </th>
                <th scope="col" className="t-label py-3 text-[color:var(--color-text-muted)]">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className="border-b border-[color:var(--color-line)]"
                >
                  <th scope="row" className="py-4 pr-4 font-normal">
                    <Link
                      href={`/admin/blog/${post.id}`}
                      className="text-[length:var(--text-body)] underline decoration-transparent underline-offset-4 transition-colors hover:decoration-current"
                    >
                      {post.title}
                    </Link>
                    <span className="t-caption block text-[color:var(--color-text-muted)]">
                      /blog/{post.slug}
                    </span>
                  </th>
                  <td className="py-4 pr-4">
                    <span
                      className={cx(
                        "pill",
                        post.status === "published" && "pill--active",
                      )}
                    >
                      {post.status}
                    </span>
                  </td>
                  <td className="t-small py-4 pr-4">
                    {post.category?.name ?? "–"}
                  </td>
                  <td className="t-small py-4 pr-4">
                    {formatDate(post.publishedAt) || "–"}
                  </td>
                  <td className="t-small py-4 pr-4">
                    {formatDate(post.updatedAt)}
                  </td>
                  <td className="py-4">
                    <form action={setPostStatus} className="flex justify-end">
                      <input type="hidden" name="id" value={post.id} />
                      <input
                        type="hidden"
                        name="status"
                        value={post.status === "published" ? "draft" : "published"}
                      />
                      <button type="submit" className="btn btn-secondary min-h-[2.75rem] px-4">
                        {post.status === "published" ? "Unpublish" : "Publish"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-16 grid gap-12 lg:grid-cols-2">
        <section aria-labelledby="categories-heading">
          <h2 id="categories-heading" className="t-h3">
            Categories
          </h2>

          <form action={createCategory} className="mt-5 flex flex-wrap items-end gap-3">
            <div className="field min-w-[14rem] flex-1">
              <label className="field__label" htmlFor="new-category">
                New category
              </label>
              <input
                id="new-category"
                name="name"
                type="text"
                required
                minLength={2}
                maxLength={60}
                className="field__control"
              />
            </div>
            <button type="submit" className="btn btn-secondary">
              Add
            </button>
          </form>

          {categories.length === 0 ? (
            <p className="t-small mt-6 text-[color:var(--color-text-muted)]">
              No categories yet.
            </p>
          ) : (
            <ul className="mt-6">
              {categories.map((category) => (
                <li
                  key={category.id}
                  className="flex items-center justify-between gap-4 border-t border-[color:var(--color-line)] py-3 last:border-b"
                >
                  <span className="t-small">
                    {category.name}{" "}
                    <span className="text-[color:var(--color-text-muted)]">
                      ({category._count.posts})
                    </span>
                  </span>
                  <form action={deleteCategory}>
                    <input type="hidden" name="id" value={category.id} />
                    <button
                      type="submit"
                      className="t-caption min-h-[2.75rem] px-2 text-[color:var(--color-danger)] underline underline-offset-4"
                    >
                      Delete
                      <span className="sr-only"> category {category.name}</span>
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="tags-heading">
          <h2 id="tags-heading" className="t-h3">
            Tags
          </h2>
          <p className="t-small mt-3 text-[color:var(--color-text-muted)]">
            Tags are created automatically when you use them on an article.
          </p>

          {tags.length === 0 ? (
            <p className="t-small mt-6 text-[color:var(--color-text-muted)]">
              No tags yet.
            </p>
          ) : (
            <ul className="mt-6">
              {tags.map((tag) => (
                <li
                  key={tag.id}
                  className="flex items-center justify-between gap-4 border-t border-[color:var(--color-line)] py-3 last:border-b"
                >
                  <span className="t-small">
                    {tag.name}{" "}
                    <span className="text-[color:var(--color-text-muted)]">
                      ({tag._count.posts})
                    </span>
                  </span>
                  <form action={deleteTag}>
                    <input type="hidden" name="id" value={tag.id} />
                    <button
                      type="submit"
                      className="t-caption min-h-[2.75rem] px-2 text-[color:var(--color-danger)] underline underline-offset-4"
                    >
                      Delete
                      <span className="sr-only"> tag {tag.name}</span>
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

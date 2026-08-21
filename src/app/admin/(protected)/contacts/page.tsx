import type { Metadata } from "next";
import Link from "next/link";

import { prisma } from "@/lib/db";
import { CONTACT_STATUSES } from "@/lib/validation";
import { cx, formatDate, truncate } from "@/lib/utils";

export const metadata: Metadata = { title: "Enquiries" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && raw.trim().length > 0 ? raw.trim() : undefined;
}

const SORTS = {
  newest: { createdAt: "desc" },
  oldest: { createdAt: "asc" },
  company: { company: "asc" },
} as const;

type SortKey = keyof typeof SORTS;

export default async function AdminContactsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const search = first(params["q"]);
  const statusParam = first(params["status"]);
  const sortParam = first(params["sort"]);

  const status = CONTACT_STATUSES.find((value) => value === statusParam);
  const sort: SortKey = (
    sortParam && sortParam in SORTS ? sortParam : "newest"
  ) as SortKey;

  const where = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { company: { contains: search } },
            { message: { contains: search } },
          ],
        }
      : {}),
  };

  const [submissions, counts] = await Promise.all([
    prisma.contactSubmission.findMany({
      where,
      orderBy: SORTS[sort],
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        serviceInterest: true,
        message: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.contactSubmission.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const countFor = (value: string) =>
    counts.find((entry) => entry.status === value)?._count._all ?? 0;

  return (
    <>
      <h1 className="t-h2">Enquiries</h1>
      <p className="t-small mt-3 max-w-[52ch] text-[color:var(--color-text-muted)]">
        Contact submissions are private. They are never exposed on the public
        site and are only visible here.
      </p>

      <nav aria-label="Filter by status" className="mt-8">
        <ul className="flex flex-wrap gap-2">
          <li>
            <Link
              href="/admin/contacts"
              className={cx("pill", !status && "pill--active")}
              aria-current={!status ? "true" : undefined}
            >
              All
            </Link>
          </li>
          {CONTACT_STATUSES.map((value) => (
            <li key={value}>
              <Link
                href={`/admin/contacts?status=${value}`}
                className={cx("pill", status === value && "pill--active")}
                aria-current={status === value ? "true" : undefined}
              >
                {value}
                <span className="ml-2 opacity-70">{countFor(value)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <form
        action="/admin/contacts"
        method="get"
        role="search"
        className="mt-6 flex flex-wrap items-end gap-4"
      >
        <div className="field min-w-[16rem] flex-1">
          <label className="field__label" htmlFor="contacts-search">
            Search
          </label>
          <input
            id="contacts-search"
            name="q"
            type="search"
            defaultValue={search ?? ""}
            className="field__control"
            placeholder="Name, email, company or message"
          />
        </div>
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <div className="field">
          <label className="field__label" htmlFor="contacts-sort">
            Sort
          </label>
          <select
            id="contacts-sort"
            name="sort"
            defaultValue={sort}
            className="field__control"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="company">Company A–Z</option>
          </select>
        </div>
        <button type="submit" className="btn btn-secondary">
          Apply
        </button>
      </form>

      {submissions.length === 0 ? (
        <div className="mt-10 border-t border-[color:var(--color-line)] pt-8">
          <h2 className="t-h3">No enquiries here</h2>
          <p className="mt-3 text-[color:var(--color-text-muted)]">
            {search || status
              ? "Nothing matches those filters."
              : "Nothing has come through the contact form yet."}
          </p>
          {search || status ? (
            <Link href="/admin/contacts" className="btn btn-secondary mt-6">
              Clear filters
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[48rem] border-collapse text-left">
            <caption className="sr-only">Contact enquiries</caption>
            <thead>
              <tr className="border-b border-[color:var(--color-line-strong)]">
                <th scope="col" className="t-label py-3 pr-4 text-[color:var(--color-text-muted)]">
                  From
                </th>
                <th scope="col" className="t-label py-3 pr-4 text-[color:var(--color-text-muted)]">
                  Message
                </th>
                <th scope="col" className="t-label py-3 pr-4 text-[color:var(--color-text-muted)]">
                  Status
                </th>
                <th scope="col" className="t-label py-3 text-[color:var(--color-text-muted)]">
                  Received
                </th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-[color:var(--color-line)]"
                >
                  <th scope="row" className="py-4 pr-4 font-normal">
                    <Link
                      href={`/admin/contacts/${entry.id}`}
                      className="text-[length:var(--text-body)] underline decoration-transparent underline-offset-4 transition-colors hover:decoration-current"
                    >
                      {entry.name}
                    </Link>
                    <span className="t-caption block text-[color:var(--color-text-muted)]">
                      {entry.company}
                    </span>
                  </th>
                  <td className="t-small py-4 pr-4 text-[color:var(--color-text-muted)]">
                    {truncate(entry.message, 90)}
                  </td>
                  <td className="py-4 pr-4">
                    <span
                      className={cx("pill", entry.status === "new" && "pill--active")}
                    >
                      {entry.status}
                    </span>
                  </td>
                  <td className="t-small py-4">{formatDate(entry.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [published, drafts, newEnquiries, totalEnquiries, recentEnquiries, recentPosts] =
    await Promise.all([
      prisma.post.count({ where: { status: "published" } }),
      prisma.post.count({ where: { status: "draft" } }),
      prisma.contactSubmission.count({ where: { status: "new" } }),
      prisma.contactSubmission.count(),
      prisma.contactSubmission.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          company: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.post.findMany({
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: { id: true, title: true, status: true, updatedAt: true },
      }),
    ]);

  const stats = [
    { label: "Published articles", value: published, href: "/admin/blog" },
    { label: "Drafts", value: drafts, href: "/admin/blog?status=draft" },
    { label: "New enquiries", value: newEnquiries, href: "/admin/contacts?status=new" },
    { label: "Total enquiries", value: totalEnquiries, href: "/admin/contacts" },
  ];

  return (
    <>
      <h1 className="t-h2">Overview</h1>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <li key={stat.label}>
            <Link
              href={stat.href}
              className="block border-t-2 border-[color:var(--color-ink)] pt-4 transition-colors duration-150 hover:border-[color:var(--color-accent)]"
            >
              <span className="t-numeral block text-[length:var(--text-h2)]">{stat.value}</span>
              <span className="t-caption mt-2 block text-[color:var(--color-text-muted)]">
                {stat.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-14 grid gap-12 lg:grid-cols-2">
        <section aria-labelledby="recent-enquiries-heading">
          <div className="flex items-baseline justify-between">
            <h2 id="recent-enquiries-heading" className="t-h3">
              Recent enquiries
            </h2>
            <Link href="/admin/contacts" className="link t-small">
              View all
            </Link>
          </div>

          {recentEnquiries.length === 0 ? (
            <p className="t-small mt-6 text-[color:var(--color-text-muted)]">
              No enquiries yet. They will appear here as soon as the contact form
              is used.
            </p>
          ) : (
            <ul className="mt-6">
              {recentEnquiries.map((entry) => (
                <li
                  key={entry.id}
                  className="border-t border-[color:var(--color-line)] last:border-b"
                >
                  <Link
                    href={`/admin/contacts/${entry.id}`}
                    className="flex min-h-[3.25rem] items-center justify-between gap-4 py-3"
                  >
                    <span>
                      <span className="block text-[length:var(--text-body)]">
                        {entry.name}
                      </span>
                      <span className="t-caption text-[color:var(--color-text-muted)]">
                        {entry.company} · {formatDate(entry.createdAt)}
                      </span>
                    </span>
                    <span className="pill shrink-0">{entry.status}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="recent-posts-heading">
          <div className="flex items-baseline justify-between">
            <h2 id="recent-posts-heading" className="t-h3">
              Recently edited
            </h2>
            <Link href="/admin/blog" className="link t-small">
              View all
            </Link>
          </div>

          {recentPosts.length === 0 ? (
            <p className="t-small mt-6 text-[color:var(--color-text-muted)]">
              No articles yet.{" "}
              <Link href="/admin/blog/new" className="link">
                Write the first one
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-6">
              {recentPosts.map((post) => (
                <li
                  key={post.id}
                  className="border-t border-[color:var(--color-line)] last:border-b"
                >
                  <Link
                    href={`/admin/blog/${post.id}`}
                    className="flex min-h-[3.25rem] items-center justify-between gap-4 py-3"
                  >
                    <span>
                      <span className="block text-[length:var(--text-body)]">
                        {post.title}
                      </span>
                      <span className="t-caption text-[color:var(--color-text-muted)]">
                        Updated {formatDate(post.updatedAt)}
                      </span>
                    </span>
                    <span className="pill shrink-0">{post.status}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

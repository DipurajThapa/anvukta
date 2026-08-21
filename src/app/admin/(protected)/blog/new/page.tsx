import type { Metadata } from "next";
import Link from "next/link";

import { PostForm } from "@/components/admin/PostForm";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "New article" };
export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <>
      <nav aria-label="Breadcrumb">
        <ol className="t-caption flex flex-wrap items-center gap-2 text-[color:var(--color-text-muted)]">
          <li>
            <Link href="/admin" className="hover:underline">
              Overview
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/admin/blog" className="hover:underline">
              Insights
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">New article</li>
        </ol>
      </nav>

      <h1 className="t-h2 mt-6">New article</h1>

      <PostForm
        categories={categories}
        values={{
          title: "",
          slug: "",
          excerpt: "",
          content: "",
          heroImage: "",
          heroImageAlt: "",
          heroPoster: "",
          categoryId: "",
          tags: "",
          status: "draft",
          publishedAt: "",
          seoTitle: "",
          seoDescription: "",
          canonicalUrl: "",
          ogImage: "",
        }}
      />
    </>
  );
}

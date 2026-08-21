import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { deletePost } from "@/app/actions/admin";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { PostForm } from "@/components/admin/PostForm";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Edit article" };
export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** <input type="datetime-local"> needs "YYYY-MM-DDTHH:mm". */
function toLocalInput(value: Date | null): string {
  if (!value) return "";
  const pad = (input: number) => String(input).padStart(2, "0");
  return [
    value.getFullYear(),
    "-",
    pad(value.getMonth() + 1),
    "-",
    pad(value.getDate()),
    "T",
    pad(value.getHours()),
    ":",
    pad(value.getMinutes()),
  ].join("");
}

export default async function EditPostPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const query = await searchParams;

  const [post, categories] = await Promise.all([
    prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        heroImage: true,
        heroImageAlt: true,
        heroPoster: true,
        categoryId: true,
        status: true,
        publishedAt: true,
        seoTitle: true,
        seoDescription: true,
        canonicalUrl: true,
        ogImage: true,
        tags: { select: { tag: { select: { name: true } } } },
      },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!post) notFound();

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
          <li aria-current="page" className="max-w-[24ch] truncate">
            {post.title}
          </li>
        </ol>
      </nav>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="t-h2">Edit article</h1>
        <form action={deletePost}>
          <input type="hidden" name="id" value={post.id} />
          <ConfirmSubmit
            label="Delete"
            title="Delete this article?"
            description={`"${post.title}" and its tag links will be permanently removed. This cannot be undone.`}
            confirmLabel="Delete permanently"
          />
        </form>
      </div>

      <PostForm
        categories={categories}
        savedNotice={query["saved"] === "1"}
        values={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          heroImage: post.heroImage ?? "",
          heroImageAlt: post.heroImageAlt ?? "",
          heroPoster: post.heroPoster ?? "",
          categoryId: post.categoryId ?? "",
          tags: post.tags.map((entry) => entry.tag.name).join(", "),
          status: post.status === "published" ? "published" : "draft",
          publishedAt: toLocalInput(post.publishedAt),
          seoTitle: post.seoTitle ?? "",
          seoDescription: post.seoDescription ?? "",
          canonicalUrl: post.canonicalUrl ?? "",
          ogImage: post.ogImage ?? "",
        }}
      />
    </>
  );
}

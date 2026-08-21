"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { AdminState } from "@/lib/form-state";
import { markdownToText } from "@/lib/markdown";
import { readingMinutes, slugify } from "@/lib/utils";
import {
  contactStatusSchema,
  postSchema,
  toFieldErrors,
} from "@/lib/validation";

/** Every mutation re-checks the session — the layout guard is not the only gate. */
async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");

  // Only one kind of account exists today. Asserting it anyway means adding a
  // lesser role later cannot quietly hand it the keys to everything.
  if (user.role !== "admin") redirect("/admin/login");

  return user;
}

function parsePostForm(formData: FormData) {
  const title = String(formData.get("title") ?? "");
  const rawSlug = String(formData.get("slug") ?? "").trim();

  return postSchema.safeParse({
    title,
    slug: rawSlug.length > 0 ? slugify(rawSlug) : slugify(title),
    excerpt: formData.get("excerpt") ?? "",
    content: formData.get("content") ?? "",
    heroImage: formData.get("heroImage") ?? "",
    heroImageAlt: formData.get("heroImageAlt") ?? "",
    heroPoster: formData.get("heroPoster") ?? "",
    categoryId: formData.get("categoryId") ?? "",
    tags: String(formData.get("tags") ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    status: String(formData.get("status") ?? "draft"),
    publishedAt: formData.get("publishedAt") ?? "",
    seoTitle: formData.get("seoTitle") ?? "",
    seoDescription: formData.get("seoDescription") ?? "",
    canonicalUrl: formData.get("canonicalUrl") ?? "",
    ogImage: formData.get("ogImage") ?? "",
  });
}

/** Connect-or-create every tag, then return the join rows for a nested write. */
async function resolveTagLinks(names: string[]) {
  const links = [];
  for (const name of names) {
    const slug = slugify(name);
    const tag = await prisma.tag.upsert({
      where: { slug },
      create: { name, slug },
      update: {},
      select: { id: true },
    });
    links.push({ tagId: tag.id });
  }
  return links;
}

function revalidatePublic(slug: string) {
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/sitemap.xml");
  revalidatePath("/feed.xml");
}

export async function savePost(
  _previous: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "").trim();

  const parsed = parsePostForm(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const data = parsed.data;

  const clash = await prisma.post.findUnique({
    where: { slug: data.slug },
    select: { id: true },
  });

  if (clash && clash.id !== id) {
    return {
      status: "error",
      message: "That slug is already in use.",
      fieldErrors: { slug: "Another article already uses this slug." },
    };
  }

  const publishedAt =
    data.status === "published" ? (data.publishedAt ?? new Date()) : (data.publishedAt ?? null);

  const common = {
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt,
    content: data.content,
    heroImage: data.heroImage || null,
    heroImageAlt: data.heroImageAlt || null,
    heroPoster: data.heroPoster || null,
    status: data.status,
    publishedAt,
    readingMinutes: readingMinutes(markdownToText(data.content)),
    seoTitle: data.seoTitle || null,
    seoDescription: data.seoDescription || null,
    canonicalUrl: data.canonicalUrl || null,
    ogImage: data.ogImage || null,
    categoryId: data.categoryId || null,
  };

  const tagLinks = await resolveTagLinks(data.tags);

  let savedSlug = data.slug;

  if (id) {
    const updated = await prisma.post.update({
      where: { id },
      data: {
        ...common,
        tags: { deleteMany: {}, create: tagLinks },
      },
      select: { slug: true },
    });
    savedSlug = updated.slug;
  } else {
    const created = await prisma.post.create({
      data: {
        ...common,
        authorId: user.id,
        tags: { create: tagLinks },
      },
      select: { id: true, slug: true },
    });
    savedSlug = created.slug;
    revalidatePublic(savedSlug);
    revalidatePath("/admin/blog");
    redirect(`/admin/blog/${created.id}?saved=1`);
  }

  revalidatePublic(savedSlug);
  revalidatePath("/admin/blog");

  return {
    status: "success",
    message:
      data.status === "published"
        ? "Article saved and published."
        : "Draft saved. It is not publicly visible.",
    fieldErrors: {},
  };
}

export async function setPostStatus(formData: FormData): Promise<void> {
  await requireUser();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || (status !== "draft" && status !== "published")) return;

  const existing = await prisma.post.findUnique({
    where: { id },
    select: { publishedAt: true, slug: true },
  });
  if (!existing) return;

  await prisma.post.update({
    where: { id },
    data: {
      status,
      publishedAt:
        status === "published" ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
    },
  });

  revalidatePublic(existing.slug);
  revalidatePath("/admin/blog");
}

export async function deletePost(formData: FormData): Promise<void> {
  await requireUser();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const existing = await prisma.post.findUnique({
    where: { id },
    select: { slug: true },
  });
  if (!existing) return;

  await prisma.post.delete({ where: { id } });

  revalidatePublic(existing.slug);
  revalidatePath("/admin/blog");
  redirect("/admin/blog?deleted=1");
}

export async function createCategory(formData: FormData): Promise<void> {
  await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) return;

  await prisma.category.upsert({
    where: { slug: slugify(name) },
    create: { name, slug: slugify(name) },
    update: {},
  });

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}

export async function deleteCategory(formData: FormData): Promise<void> {
  await requireUser();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // Posts keep existing; the relation is set to null by the schema.
  await prisma.category.delete({ where: { id } });

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}

export async function deleteTag(formData: FormData): Promise<void> {
  await requireUser();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.tag.delete({ where: { id } });

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}

export async function updateContactStatus(formData: FormData): Promise<void> {
  await requireUser();

  const parsed = contactStatusSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    status: String(formData.get("status") ?? ""),
  });
  if (!parsed.success) return;

  const updated = await prisma.contactSubmission.updateMany({
    where: { id: parsed.data.id },
    data: { status: parsed.data.status },
  });
  if (updated.count === 0) return;

  revalidatePath("/admin/contacts");
  revalidatePath(`/admin/contacts/${parsed.data.id}`);
}

/* -------------------------------------------------------------------------- */
/* Chat                                                                        */
/* -------------------------------------------------------------------------- */

/** A person answering a chat thread. Appears in the visitor's window at once. */
export async function replyToChat(formData: FormData): Promise<void> {
  await requireUser();

  const id = String(formData.get("id") ?? "");
  const body = String(formData.get("body") ?? "").trim().slice(0, 2000);
  if (!id || body.length < 2) return;

  const conversation = await prisma.chatConversation.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!conversation) return;

  await prisma.chatMessage.create({
    data: { conversationId: conversation.id, role: "human", body },
  });

  // A reply always puts the thread in human mode, so the bot stops answering.
  await prisma.chatConversation.update({
    where: { id: conversation.id },
    data: { status: "human", escalatedAt: new Date() },
  });

  revalidatePath("/admin/chats");
  revalidatePath(`/admin/chats/${id}`);
}

export async function closeChat(formData: FormData): Promise<void> {
  await requireUser();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const closed = await prisma.chatConversation.updateMany({
    where: { id },
    data: { status: "closed" },
  });
  if (closed.count === 0) return;

  revalidatePath("/admin/chats");
  revalidatePath(`/admin/chats/${id}`);
}

/* -------------------------------------------------------------------------- */
/* Erasure                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Deletes an enquiry outright.
 *
 * The privacy notice promises that anyone can ask to have their data removed
 * and that we will act within thirty days. That promise needs a button behind
 * it, otherwise honouring it means editing the database by hand.
 */
export async function deleteContactSubmission(formData: FormData): Promise<void> {
  const user = await requireUser();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const removed = await prisma.contactSubmission.deleteMany({ where: { id } });

  if (removed.count > 0) {
    console.info("[erasure] enquiry deleted", { by: user.id, record: id });
  }

  revalidatePath("/admin/contacts");
  redirect("/admin/contacts?deleted=1");
}

/** Deletes a conversation and, by cascade, every message in it. */
export async function deleteChatConversation(formData: FormData): Promise<void> {
  const user = await requireUser();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const removed = await prisma.chatConversation.deleteMany({ where: { id } });

  if (removed.count > 0) {
    console.info("[erasure] chat conversation deleted", { by: user.id, record: id });
  }

  revalidatePath("/admin/chats");
  redirect("/admin/chats?deleted=1");
}

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Integration tests against a real, disposable SQLite database.
 * DATABASE_URL is redirected before the modules under test are imported, so the
 * developer's dev.db is never touched.
 */

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "anvukta-test-"));
const dbFile = path.join(tempDir, "test.db").replaceAll("\\", "/");

process.env["DATABASE_URL"] = `file:${dbFile}`;
process.env["SESSION_SECRET"] = "test-secret";

type Db = typeof import("@/lib/db")["prisma"];
type Posts = typeof import("@/lib/posts");
type RateLimit = typeof import("@/lib/rate-limit");

let prisma: Db;
let posts: Posts;
let rateLimit: RateLimit["rateLimit"];

const DAY = 24 * 60 * 60 * 1000;

beforeAll(async () => {
  // Apply the committed migrations to the fresh database.
  const { default: Database } = await import("better-sqlite3");
  const db = new Database(dbFile);

  const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
  const dirs = fs
    .readdirSync(migrationsDir)
    .filter((entry) => fs.statSync(path.join(migrationsDir, entry)).isDirectory())
    .sort();

  for (const dir of dirs) {
    db.exec(fs.readFileSync(path.join(migrationsDir, dir, "migration.sql"), "utf8"));
  }
  db.close();

  ({ prisma } = await import("@/lib/db"));
  posts = await import("@/lib/posts");
  ({ rateLimit } = await import("@/lib/rate-limit"));

  const category = await prisma.category.create({
    data: { name: "AI Transformation", slug: "ai-transformation" },
  });
  const other = await prisma.category.create({
    data: { name: "Governance", slug: "governance" },
  });
  const tag = await prisma.tag.create({ data: { name: "Adoption", slug: "adoption" } });

  await prisma.post.create({
    data: {
      title: "Published One",
      slug: "published-one",
      excerpt: "Excerpt one about programme recovery.",
      content: "Body one mentioning kubernetes.",
      status: "published",
      publishedAt: new Date(Date.now() - 2 * DAY),
      categoryId: category.id,
      tags: { create: [{ tagId: tag.id }] },
    },
  });

  await prisma.post.create({
    data: {
      title: "Published Two",
      slug: "published-two",
      excerpt: "Excerpt two.",
      content: "Body two.",
      status: "published",
      publishedAt: new Date(Date.now() - 1 * DAY),
      categoryId: other.id,
    },
  });

  await prisma.post.create({
    data: {
      title: "Hidden Draft",
      slug: "hidden-draft",
      excerpt: "Draft excerpt.",
      content: "Draft body.",
      status: "draft",
      categoryId: category.id,
    },
  });

  await prisma.post.create({
    data: {
      title: "Scheduled For Later",
      slug: "scheduled-for-later",
      excerpt: "Future excerpt.",
      content: "Future body.",
      status: "published",
      publishedAt: new Date(Date.now() + 7 * DAY),
      categoryId: category.id,
    },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe("published post queries", () => {
  it("returns only published, already-dated posts, newest first", async () => {
    const result = await posts.getPublishedPosts();
    expect(result.posts.map((post) => post.slug)).toEqual([
      "published-two",
      "published-one",
    ]);
    expect(result.total).toBe(2);
  });

  it("never exposes a draft by slug", async () => {
    await expect(posts.getPostBySlug("hidden-draft")).resolves.toBeNull();
  });

  it("never exposes a future-dated post by slug", async () => {
    await expect(posts.getPostBySlug("scheduled-for-later")).resolves.toBeNull();
  });

  it("returns a published post by slug with its relations flattened", async () => {
    const post = await posts.getPostBySlug("published-one");
    expect(post?.title).toBe("Published One");
    expect(post?.category?.slug).toBe("ai-transformation");
    expect(post?.tags).toEqual([{ name: "Adoption", slug: "adoption" }]);
  });

  it("filters by category", async () => {
    const result = await posts.getPublishedPosts({ category: "ai-transformation" });
    expect(result.posts.map((post) => post.slug)).toEqual(["published-one"]);
  });

  it("filters by tag", async () => {
    const result = await posts.getPublishedPosts({ tag: "adoption" });
    expect(result.posts.map((post) => post.slug)).toEqual(["published-one"]);
  });

  it("searches title, excerpt and body", async () => {
    await expect(
      posts.getPublishedPosts({ search: "kubernetes" }),
    ).resolves.toMatchObject({ total: 1 });
    await expect(
      posts.getPublishedPosts({ search: "programme recovery" }),
    ).resolves.toMatchObject({ total: 1 });
    await expect(
      posts.getPublishedPosts({ search: "no such phrase" }),
    ).resolves.toMatchObject({ total: 0 });
  });

  it("never surfaces a draft through search", async () => {
    const result = await posts.getPublishedPosts({ search: "Draft" });
    expect(result.total).toBe(0);
  });

  it("clamps an out-of-range page rather than failing", async () => {
    const result = await posts.getPublishedPosts({ page: 0 });
    expect(result.page).toBe(1);
    expect(result.totalPages).toBeGreaterThanOrEqual(1);
  });

  it("returns an empty page beyond the last one", async () => {
    const result = await posts.getPublishedPosts({ page: 99 });
    expect(result.posts).toEqual([]);
    expect(result.total).toBe(2);
  });
});

describe("related posts", () => {
  it("excludes the post itself and drafts", async () => {
    const related = await posts.getRelatedPosts("published-one", "ai-transformation");
    expect(related.map((post) => post.slug)).not.toContain("published-one");
    expect(related.map((post) => post.slug)).not.toContain("hidden-draft");
    expect(related.map((post) => post.slug)).toContain("published-two");
  });
});

describe("public taxonomies", () => {
  it("omits categories whose only posts are drafts or future-dated", async () => {
    const categories = await posts.getPublicCategories();
    const ai = categories.find((entry) => entry.slug === "ai-transformation");
    expect(ai?.count).toBe(1);
    expect(categories.map((entry) => entry.slug)).toContain("governance");
  });

  it("counts only published posts per tag", async () => {
    const tags = await posts.getPublicTags();
    expect(tags).toEqual([{ name: "Adoption", slug: "adoption", count: 1 }]);
  });
});

describe("sitemap source", () => {
  it("lists published slugs only", async () => {
    const slugs = (await posts.getAllPublishedSlugs()).map((entry) => entry.slug);
    expect(slugs).toEqual(["published-two", "published-one"]);
  });
});

describe("rate limiting", () => {
  it("allows requests up to the limit, then blocks", async () => {
    const key = `test:${Date.now()}`;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const result = await rateLimit(key, 3, 60);
      expect(result.allowed, `attempt ${attempt}`).toBe(true);
      expect(result.remaining).toBe(3 - attempt);
    }

    const blocked = await rateLimit(key, 3, 60);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("starts a fresh window once the previous one expires", async () => {
    const key = `expiring:${Date.now()}`;

    await rateLimit(key, 1, 60);
    expect((await rateLimit(key, 1, 60)).allowed).toBe(false);

    // Force the window to have already ended.
    await prisma.rateLimit.update({
      where: { key },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    expect((await rateLimit(key, 1, 60)).allowed).toBe(true);
  });

  it("tracks separate keys independently", async () => {
    const a = `a:${Date.now()}`;
    const b = `b:${Date.now()}`;

    await rateLimit(a, 1, 60);
    expect((await rateLimit(a, 1, 60)).allowed).toBe(false);
    expect((await rateLimit(b, 1, 60)).allowed).toBe(true);
  });
});

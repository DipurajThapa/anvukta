import { prisma } from "@/lib/db";
import { absoluteUrl, site } from "@/lib/site";

export const dynamic = "force-dynamic";

/** Escape the five XML entities so titles and excerpts cannot break the feed. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(): Promise<Response> {
  const posts = await prisma.post.findMany({
    where: { status: "published", publishedAt: { not: null, lte: new Date() } },
    select: {
      title: true,
      slug: true,
      excerpt: true,
      publishedAt: true,
      category: { select: { name: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: 50,
  });

  const items = posts
    .map((post) => {
      const url = absoluteUrl(`/blog/${post.slug}`);
      return [
        "    <item>",
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${escapeXml(url)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
        `      <description>${escapeXml(post.excerpt)}</description>`,
        post.category
          ? `      <category>${escapeXml(post.category.name)}</category>`
          : null,
        post.publishedAt
          ? `      <pubDate>${post.publishedAt.toUTCString()}</pubDate>`
          : null,
        "    </item>",
      ]
        .filter((line) => line !== null)
        .join("\n");
    })
    .join("\n");

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(`Insights | ${site.name}`)}</title>`,
    `    <link>${escapeXml(absoluteUrl("/blog"))}</link>`,
    `    <description>${escapeXml(site.description)}</description>`,
    "    <language>en</language>",
    `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
    `    <atom:link href="${escapeXml(absoluteUrl("/feed.xml"))}" rel="self" type="application/rss+xml" />`,
    items,
    "  </channel>",
    "</rss>",
  ].join("\n");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

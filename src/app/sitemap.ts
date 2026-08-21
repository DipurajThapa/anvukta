import type { MetadataRoute } from "next";

import { getAllPublishedSlugs } from "@/lib/posts";
import { absoluteUrl, isDemoMode } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Nothing to offer a crawler while the site is only being tested.
  if (isDemoMode()) return [];

  const posts = await getAllPublishedSlugs();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: absoluteUrl("/proposition"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/contact"),
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/blog"),
      lastModified: posts[0]?.updatedAt ?? new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  staticRoutes.push({
    url: absoluteUrl("/privacy"),
    lastModified: new Date(),
    changeFrequency: "yearly",
    priority: 0.3,
  });

  // Drafts are never returned by getAllPublishedSlugs, so they cannot appear here.
  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: post.updatedAt,
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...postRoutes];
}

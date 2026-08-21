import type { MetadataRoute } from "next";

import { absoluteUrl, isDemoMode, SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // A shared test link should never end up in a search result.
  if (isDemoMode()) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Nothing behind authentication, and no internal endpoint, is indexable.
        disallow: ["/admin", "/admin/", "/api/"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}

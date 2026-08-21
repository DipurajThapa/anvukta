import type { NextConfig } from "next";

/**
 * Security headers applied to every response.
 * The CSP allows only same-origin resources plus the inline styles React emits
 * for CSS custom properties; there are no third-party scripts on this site.
 */
const isProduction = process.env.NODE_ENV === "production";

/** Mirrors isDemoMode() in src/lib/site.ts, which this file cannot import. */
const demoModeValue = process.env.DEMO_MODE?.trim().toLowerCase();
const isDemo = demoModeValue === "true" || demoModeValue === "1" || demoModeValue === "yes";

const contentSecurityPolicy = [
  "default-src 'self'",
  // Next injects small inline bootstrap scripts; 'unsafe-eval' is dev-only (React Refresh).
  `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "manifest-src 'self'",
  ...(isProduction ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  trailingSlash: false,

  images: {
    formats: ["image/avif", "image/webp"],
    // Next 16 rejects any quality not listed here with a 400, so every value
    // used in a `quality` prop must appear. 62 suits the treated photographs:
    // the tritone and grain hide compression that would show on a clean image.
    qualities: [62, 75],
  },

  compiler: {
    // Strip console output from the production bundle, keeping error reporting.
    removeConsole: isProduction ? { exclude: ["error", "warn"] } : false,
  },

  serverExternalPackages: ["@prisma/client", "better-sqlite3", "nodemailer"],

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          ...securityHeaders,
          // A header covers what a meta tag cannot: the feed, the OG image and
          // every other non-HTML response.
          ...(isDemo
            ? [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }]
            : []),
        ],
      },
      {
        // Admin responses must never be cached by a shared cache.
        source: "/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
    ];
  },
};

export default nextConfig;

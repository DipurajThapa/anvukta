/**
 * Launch-sensitive details are configuration, not content.
 * Every value below can be overridden with an environment variable so the site
 * can go live without a code change. Defaults are clearly-marked placeholders.
 */

function envOr(key: string, fallback: string): string {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : fallback;
}

/**
 * True while the site is being shared for testing rather than published.
 *
 * Set DEMO_MODE=true and every page asks search engines to stay away, robots.txt
 * disallows everything and the sitemap goes empty. Read at call time, not module
 * load, so a test can flip it. Turn it off for the real launch.
 */
export function isDemoMode(): boolean {
  const value = process.env.DEMO_MODE?.trim().toLowerCase();
  return value === "true" || value === "1" || value === "yes";
}

/** The one place the public address is written down. */
const CONTACT_EMAIL = envOr("NEXT_PUBLIC_CONTACT_EMAIL", "contact@anvukta.com");

const rawSiteUrl = envOr("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");

/** Canonical origin, always without a trailing slash. */
export const SITE_URL = rawSiteUrl.replace(/\/+$/, "");

export const site = {
  name: "Anvukta Consulting Service",
  shortName: "Anvukta",
  descriptor: "Business, Technology & AI",
  tagline: "Strategy. Reinvention. Delivery.",
  description:
    "Senior-led advisory and transformation support connecting executive intent, technology decisions and disciplined delivery.",
  url: SITE_URL,
  locale: "en_GB",
  lang: "en",

  contact: {
    email: CONTACT_EMAIL,
    /** Digits only, as WhatsApp's link format requires. */
    whatsapp: envOr("NEXT_PUBLIC_CONTACT_WHATSAPP", "971563565659"),
    whatsappDisplay: envOr("NEXT_PUBLIC_CONTACT_WHATSAPP_DISPLAY", "+971 56 356 5659"),
    phone: envOr("NEXT_PUBLIC_CONTACT_PHONE", ""),
    addressLines: envOr("NEXT_PUBLIC_CONTACT_ADDRESS", "")
      .split("|")
      .map((line) => line.trim())
      .filter(Boolean),
    region: envOr("NEXT_PUBLIC_CONTACT_REGION", "GCC"),
  },

  /** Generated at build time by src/app/opengraph-image.tsx. */
  ogImagePath: "/opengraph-image",

  social: {
    linkedin: envOr(
      "NEXT_PUBLIC_SOCIAL_LINKEDIN",
      "https://www.linkedin.com/company/anvukta/home/",
    ),
    x: envOr("NEXT_PUBLIC_SOCIAL_X", ""),
  },

} as const;

export type NavItem = {
  label: string;
  href: string;
};

/**
 * Contact is deliberately absent here. The button beside this nav goes to the
 * same page, and two controls side by side leading to one place reads as a
 * mistake. The button carries it.
 */
export const primaryNav: readonly NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Our Proposition", href: "/proposition" },
  { label: "Insights", href: "/blog" },
] as const;

export const PRIMARY_CTA = {
  label: "Contact us",
  href: "/contact",
} as const;

/**
 * The three ways to reach us, in the order we want people to try them.
 * Every call to action on the site opens one of these, so a reader never has to
 * hunt for a way to start a conversation.
 */
export const CONTACT_CHANNELS = [
  {
    id: "email",
    label: "Email us",
    detail: CONTACT_EMAIL,
    blurb: "Best for a considered question. A person replies within two working days.",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    detail: "+971 56 356 5659",
    blurb: "Best when you want a quick answer during GCC working hours.",
  },
  {
    id: "chat",
    label: "Chat with us",
    detail: "Answers from our own material",
    blurb: "Ask about our services and get a straight answer, with a person one click away.",
  },
] as const;

export type ContactChannelId = (typeof CONTACT_CHANNELS)[number]["id"];

/** Pre-fills the WhatsApp message so the first reply can be useful. */
export function whatsappHref(message?: string): string {
  const text = message ?? "Hello Anvukta, I would like to talk about a transformation programme.";
  return `https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(text)}`;
}

export function mailtoHref(subject?: string): string {
  const params = subject ? `?subject=${encodeURIComponent(subject)}` : "";
  return `mailto:${site.contact.email}${params}`;
}

/** Contact-form "service of interest" options, mapped to real capability areas. */
export const SERVICE_INTERESTS = [
  "Business Transformation & Operating-Model Advisory",
  "Digital & AI Transformation Strategy",
  "Portfolio, Programme Governance & Recovery",
  "Digital Product, SaaS & Platform Engineering",
  "Cloud Architecture, Migration & Cost Optimisation",
  "AI-Enabled Workflow Automation & Responsible Adoption",
  "Data, Analytics & Executive Decision Systems",
  "Customer Experience, E-Commerce & Omnichannel",
  "Process Excellence, Service Operations & Vendor Performance",
  "Digital Growth, Technical SEO, GEO & Go-To-Market",
  "Not sure yet. I want to talk the problem through first",
] as const;

export type ServiceInterest = (typeof SERVICE_INTERESTS)[number];

/** Absolute URL helper — used for canonicals, sitemap, OG tags and JSON-LD. */
export function absoluteUrl(path = "/"): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

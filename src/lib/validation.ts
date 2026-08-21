import { z } from "zod";

import { SERVICE_INTERESTS } from "@/lib/site";

/** Pragmatic email shape check. Deliverability is proven by replying, not by regex. */
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

/** Trim first, then validate — stops whitespace-only values passing "min(1)". */
const trimmed = z.string().transform((value) => value.trim());

const requiredText = (label: string, min: number, max: number) =>
  trimmed.pipe(
    z
      .string()
      .min(min, `${label} must be at least ${min} characters.`)
      .max(max, `${label} must be ${max} characters or fewer.`),
  );

const optionalText = (label: string, max: number) =>
  trimmed.pipe(
    z.string().max(max, `${label} must be ${max} characters or fewer.`),
  );

/* ========================================================================== */
/* Contact                                                                     */
/* ========================================================================== */

export const contactSchema = z.object({
  name: requiredText("Full name", 2, 120),
  email: trimmed.pipe(
    z
      .string()
      .min(1, "Work email is required.")
      .max(200, "Work email must be 200 characters or fewer.")
      .regex(EMAIL_RE, "Enter a valid work email address."),
  ),
  company: requiredText("Company", 2, 160),
  jobTitle: optionalText("Job title", 120).optional(),
  phone: optionalText("Phone", 40)
    .refine(
      (value) => value === "" || /^[+\d][\d\s()./-]{5,}$/.test(value),
      "Enter a valid phone number, or leave it blank.",
    )
    .optional(),
  serviceInterest: z
    .enum(SERVICE_INTERESTS)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  message: requiredText("Message", 20, 4000),
  consent: z
    .union([z.boolean(), z.literal("on"), z.literal("true"), z.literal("")])
    .transform((value) => value === true || value === "on" || value === "true")
    .refine((value) => value, "Please confirm you agree to be contacted."),

  /* Spam controls — never rendered to a human. */
  website: z.string().max(0, "Submission rejected.").optional().default(""),
  formLoadedAt: z.coerce.number().int().nonnegative().optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;

/* ========================================================================== */
/* Chat handover                                                               */
/* ========================================================================== */

/**
 * Details a visitor gives when asking for a person. Both are optional: someone
 * can hand over anonymously and read the reply in the panel. What arrives is
 * still checked, so the admin queue never fills with junk shaped like contacts.
 */
export const handoverSchema = z.object({
  name: trimmed.pipe(z.string().max(120)).catch(""),
  email: trimmed
    .pipe(z.string().max(200))
    .refine((value) => value === "" || EMAIL_RE.test(value), "Enter a valid email address.")
    .catch(""),
});

/* ========================================================================== */
/* Auth                                                                        */
/* ========================================================================== */

export const loginSchema = z.object({
  email: trimmed.pipe(z.string().regex(EMAIL_RE, "Enter a valid email address.")),
  password: z.string().min(1, "Enter your password."),
});

/* ========================================================================== */
/* Posts                                                                       */
/* ========================================================================== */

/**
 * An image or video reference an editor typed in.
 *
 * Restricted to a path on this site or an https address. Without this an editor
 * could paste any scheme at all into something the page then renders, and the
 * admin account becomes a way to change what visitors load.
 */
const mediaRef = (label: string) =>
  optionalText(label, 300).refine(
    (value) => value === "" || value.startsWith("/") || /^https:\/\/\S+$/.test(value),
    `${label} must be a path starting with / or an https:// address.`,
  );

export const POST_STATUSES = ["draft", "published"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export const postSchema = z
  .object({
    title: requiredText("Title", 3, 200),
    slug: trimmed.pipe(
      z
        .string()
        .min(3, "Slug must be at least 3 characters.")
        .max(90, "Slug must be 90 characters or fewer.")
        .regex(
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
          "Slug may contain lowercase letters, numbers and single hyphens only.",
        ),
    ),
    excerpt: requiredText("Excerpt", 40, 320),
    content: requiredText("Content", 80, 120_000),
    heroImage: mediaRef("Hero image").optional(),
    heroImageAlt: optionalText("Hero image alt text", 200).optional(),
    heroPoster: mediaRef("Video poster image").optional(),
    categoryId: optionalText("Category", 60).optional(),
    tags: z
      .array(trimmed.pipe(z.string().min(1).max(40)))
      .max(12, "Use 12 tags or fewer.")
      .default([]),
    status: z.enum(POST_STATUSES),
    publishedAt: trimmed
      .pipe(z.string())
      .optional()
      .transform((value) => (value ? new Date(value) : undefined))
      .refine(
        (value) => value === undefined || !Number.isNaN(value.getTime()),
        "Enter a valid publication date.",
      ),
    seoTitle: optionalText("SEO title", 70).optional(),
    seoDescription: optionalText("Meta description", 180).optional(),
    canonicalUrl: optionalText("Canonical URL", 300)
      .refine(
        (value) => value === "" || /^https?:\/\/\S+$/.test(value),
        "Canonical URL must start with http:// or https://.",
      )
      .optional(),
    ogImage: mediaRef("Open Graph image").optional(),
  })
  .superRefine((value, ctx) => {
    if (value.status === "published" && !value.excerpt) {
      ctx.addIssue({
        code: "custom",
        path: ["excerpt"],
        message: "An excerpt is required before publishing.",
      });
    }
  });

export type PostInput = z.infer<typeof postSchema>;

export const CONTACT_STATUSES = ["new", "read", "contacted", "closed"] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export const contactStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(CONTACT_STATUSES),
});

/* ========================================================================== */
/* Helpers                                                                     */
/* ========================================================================== */

export type FieldErrors = Record<string, string>;

/** Flatten a ZodError into { fieldName: firstMessage } for the UI. */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const result: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!(key in result)) result[key] = issue.message;
  }
  return result;
}

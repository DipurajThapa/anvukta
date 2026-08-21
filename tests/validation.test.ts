import { describe, expect, it } from "vitest";

import { contactSchema, postSchema, toFieldErrors } from "@/lib/validation";

const validContact = {
  name: "Dana Fielding",
  email: "dana@example.com",
  company: "Example Holdings",
  message: "Our transformation programme has stalled between design and delivery.",
  consent: "on",
  website: "",
};

describe("contactSchema", () => {
  it("accepts a complete, valid submission", () => {
    const result = contactSchema.safeParse(validContact);
    expect(result.success).toBe(true);
  });

  it("trims whitespace before checking minimum lengths", () => {
    const result = contactSchema.safeParse({ ...validContact, name: "   " });
    expect(result.success).toBe(false);
    expect(toFieldErrors(result.error!)["name"]).toMatch(/at least 2/);
  });

  it("rejects a malformed email", () => {
    const result = contactSchema.safeParse({ ...validContact, email: "dana@example" });
    expect(result.success).toBe(false);
    expect(toFieldErrors(result.error!)["email"]).toMatch(/valid work email/);
  });

  it("requires consent", () => {
    const result = contactSchema.safeParse({ ...validContact, consent: "" });
    expect(result.success).toBe(false);
    expect(toFieldErrors(result.error!)["consent"]).toMatch(/agree to be contacted/);
  });

  it("rejects a filled honeypot field", () => {
    const result = contactSchema.safeParse({
      ...validContact,
      website: "http://spam.example",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a blank optional phone but rejects a malformed one", () => {
    expect(contactSchema.safeParse({ ...validContact, phone: "" }).success).toBe(true);
    expect(contactSchema.safeParse({ ...validContact, phone: "abc" }).success).toBe(false);
  });

  it("rejects an unknown service of interest", () => {
    const result = contactSchema.safeParse({
      ...validContact,
      serviceInterest: "Something we do not offer",
    });
    expect(result.success).toBe(false);
  });

  it("enforces a maximum message length", () => {
    const result = contactSchema.safeParse({
      ...validContact,
      message: "x".repeat(4001),
    });
    expect(result.success).toBe(false);
  });
});

const validPost = {
  title: "Why AI Pilots Stall",
  slug: "why-ai-pilots-stall",
  excerpt: "A short but sufficiently long excerpt for the validation rule to pass.",
  content: "x".repeat(100),
  status: "draft",
  tags: [],
};

describe("postSchema", () => {
  it("accepts a valid draft", () => {
    expect(postSchema.safeParse(validPost).success).toBe(true);
  });

  it("rejects slugs with uppercase, spaces or double hyphens", () => {
    for (const slug of ["Why-AI", "why ai", "why--ai"]) {
      const result = postSchema.safeParse({ ...validPost, slug });
      expect(result.success, slug).toBe(false);
    }
  });

  it("rejects a canonical URL without a scheme", () => {
    const result = postSchema.safeParse({
      ...validPost,
      canonicalUrl: "example.com/post",
    });
    expect(result.success).toBe(false);
  });

  it("accepts an https canonical URL", () => {
    const result = postSchema.safeParse({
      ...validPost,
      canonicalUrl: "https://example.com/post",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown status", () => {
    expect(postSchema.safeParse({ ...validPost, status: "archived" }).success).toBe(
      false,
    );
  });

  it("caps the number of tags", () => {
    const tags = Array.from({ length: 13 }, (_, index) => `tag-${index}`);
    expect(postSchema.safeParse({ ...validPost, tags }).success).toBe(false);
  });

  it("rejects an invalid publication date", () => {
    const result = postSchema.safeParse({
      ...validPost,
      publishedAt: "not-a-date",
    });
    expect(result.success).toBe(false);
  });
});

describe("toFieldErrors", () => {
  it("keeps only the first message per field", () => {
    const result = contactSchema.safeParse({ ...validContact, name: "" });
    const errors = toFieldErrors(result.error!);
    expect(Object.keys(errors)).toContain("name");
    expect(typeof errors["name"]).toBe("string");
  });
});

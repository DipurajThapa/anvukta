import { describe, expect, it } from "vitest";

import { renderMarkdown } from "@/lib/markdown";
import { jsonLdScript } from "@/lib/seo";
import { slugify } from "@/lib/utils";
import { contactSchema, handoverSchema, postSchema } from "@/lib/validation";

/**
 * These pin the defences that are easy to weaken by accident. Each one starts
 * from something an attacker would actually send.
 */

const validPost = {
  title: "A perfectly ordinary article",
  slug: "a-perfectly-ordinary-article",
  excerpt: "An excerpt long enough to satisfy the minimum length rule for publishing.",
  content: "Body text ".repeat(20),
  status: "draft" as const,
  tags: [],
};

describe("stored content cannot become script", () => {
  it("drops script tags from an article body", () => {
    const { html } = renderMarkdown("Hello\n\n<script>alert(1)</script>\n\nGoodbye");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("alert(1)");
  });

  it("drops inline event handlers", () => {
    const { html } = renderMarkdown('<img src="x" onerror="alert(1)">');
    expect(html).not.toContain("onerror");
  });

  it("refuses a javascript: link", () => {
    const { html } = renderMarkdown("[click me](javascript:alert(1))");
    expect(html).not.toContain("javascript:");
  });

  it("marks outbound links so they cannot reach back", () => {
    const { html } = renderMarkdown("[out](https://example.com)");
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("cannot inject an attribute through a heading id", () => {
    const { html, headings } = renderMarkdown('## Break "out" <b>now</b>');
    expect(html).not.toContain('id="break"out"');
    for (const heading of headings) expect(heading.id).toMatch(/^[a-z0-9-]+$/);
  });

  it("keeps a slug to safe characters whatever is thrown at it", () => {
    expect(slugify('"><script>alert(1)</script>')).toMatch(/^[a-z0-9-]+$/);
    expect(slugify("../../etc/passwd")).toMatch(/^[a-z0-9-]+$/);
  });
});

describe("structured data cannot break out of its tag", () => {
  it("escapes a closing script tag hidden in content", () => {
    const payload = jsonLdScript({ name: "</script><script>alert(1)</script>" });
    expect(payload).not.toContain("</script>");
    expect(payload).toContain(String.raw`\u003c`);
  });
});

describe("an editor cannot point the page at anything they like", () => {
  it("refuses a javascript: hero image", () => {
    const result = postSchema.safeParse({ ...validPost, heroImage: "javascript:alert(1)" });
    expect(result.success).toBe(false);
  });

  it("refuses a data: hero image", () => {
    const result = postSchema.safeParse({
      ...validPost,
      heroImage: "data:text/html,<script>alert(1)</script>",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a path on this site and an https address", () => {
    expect(postSchema.safeParse({ ...validPost, heroImage: "/images/a.jpg" }).success).toBe(true);
    expect(
      postSchema.safeParse({ ...validPost, heroImage: "https://cdn.example.com/a.jpg" }).success,
    ).toBe(true);
  });

  it("will not take a slug with a path in it", () => {
    const result = postSchema.safeParse({ ...validPost, slug: "../../admin" });
    expect(result.success).toBe(false);
  });
});

describe("the contact form rejects obvious automation", () => {
  const good = {
    name: "Dana Reed",
    email: "dana@example.com",
    company: "Example Ltd",
    message: "We would like to talk about a delivery review for our platform team.",
    consent: "on",
  };

  it("accepts a real enquiry", () => {
    expect(contactSchema.safeParse({ ...good, website: "" }).success).toBe(true);
  });

  it("rejects anything that fills the hidden field", () => {
    const result = contactSchema.safeParse({ ...good, website: "http://spam.example" });
    expect(result.success).toBe(false);
  });

  it("will not accept a submission without consent", () => {
    expect(contactSchema.safeParse({ ...good, consent: "" }).success).toBe(false);
  });

  it("will not accept a service that is not on the list", () => {
    const result = contactSchema.safeParse({ ...good, serviceInterest: "anything-i-like" });
    expect(result.success).toBe(false);
  });
});

describe("chat handover details are checked", () => {
  it("keeps a real name and email", () => {
    const result = handoverSchema.parse({ name: "Dana Reed", email: "dana@example.com" });
    expect(result.email).toBe("dana@example.com");
  });

  it("throws away a junk email rather than queueing it", () => {
    expect(handoverSchema.parse({ name: "", email: "not-an-email" }).email).toBe("");
  });

  it("trims an over-long name instead of failing the handover", () => {
    const result = handoverSchema.parse({ name: "a".repeat(500), email: "" });
    expect(result.name).toBe("");
  });
});

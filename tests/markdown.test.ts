import { describe, expect, it } from "vitest";

import { markdownToText, renderMarkdown } from "@/lib/markdown";

describe("renderMarkdown sanitisation", () => {
  it("strips script tags entirely", () => {
    const { html } = renderMarkdown(
      "Hello\n\n<script>alert('xss')</script>\n\nWorld",
    );
    expect(html).not.toContain("<script");
    expect(html).not.toContain("alert(");
  });

  it("removes inline event handlers", () => {
    const { html } = renderMarkdown('<p onclick="steal()">text</p>');
    expect(html).not.toContain("onclick");
    expect(html).toContain("text");
  });

  it("drops javascript: URLs", () => {
    const { html } = renderMarkdown("[click](javascript:alert(1))");
    expect(html).not.toContain("javascript:");
  });

  it("marks external links safe and leaves internal links alone", () => {
    const { html } = renderMarkdown(
      "[external](https://example.com) and [internal](/contact)",
    );
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('href="/contact"');
  });

  it("forces lazy loading on images", () => {
    const { html } = renderMarkdown("![alt](/media/photo.jpg)");
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('decoding="async"');
  });

  it("keeps the callout markup used by seeded articles", () => {
    const { html } = renderMarkdown(
      '<div class="callout"><span class="callout__label">Note</span>Body</div>',
    );
    expect(html).toContain('class="callout"');
    expect(html).toContain('class="callout__label"');
  });

  it("does not allow arbitrary class names through", () => {
    const { html } = renderMarkdown('<div class="evil">Body</div>');
    expect(html).not.toContain('class="evil"');
  });
});

describe("renderMarkdown headings", () => {
  it("adds ids to h2 and h3 and returns them in order", () => {
    const { html, headings } = renderMarkdown(
      "## First Section\n\ntext\n\n### Nested One\n\ntext\n\n## Second Section",
    );

    expect(headings).toEqual([
      { id: "first-section", text: "First Section", level: 2 },
      { id: "nested-one", text: "Nested One", level: 3 },
      { id: "second-section", text: "Second Section", level: 2 },
    ]);
    expect(html).toContain('<h2 id="first-section">');
    expect(html).toContain('<h3 id="nested-one">');
  });

  it("de-duplicates repeated heading ids", () => {
    const { headings } = renderMarkdown("## Same\n\ntext\n\n## Same");
    expect(headings.map((heading) => heading.id)).toEqual(["same", "same-2"]);
  });
});

describe("markdownToText", () => {
  it("returns plain text with no markup", () => {
    const text = markdownToText("## Title\n\nSome **bold** copy with [a link](/x).");
    expect(text).not.toContain("<");
    expect(text).toContain("Some bold copy with a link");
  });
});

import "server-only";

import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

import { slugify } from "@/lib/utils";

export type Heading = { id: string; text: string; level: 2 | 3 };

marked.setOptions({ gfm: true, breaks: false });

/**
 * Article bodies are authored as Markdown and rendered on the server.
 * The result is always sanitised before it reaches a page, so stored content
 * can never introduce script, event handlers or unsafe URLs.
 */
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "h2",
    "h3",
    "h4",
    "p",
    "a",
    "ul",
    "ol",
    "li",
    "blockquote",
    "strong",
    "em",
    "code",
    "pre",
    "hr",
    "br",
    "figure",
    "figcaption",
    "img",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "div",
    "span",
  ],
  allowedAttributes: {
    a: ["href", "title", "rel", "target"],
    img: ["src", "alt", "width", "height", "loading", "decoding"],
    h2: ["id"],
    h3: ["id"],
    h4: ["id"],
    div: ["class"],
    span: ["class"],
    th: ["scope"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedClasses: {
    div: ["callout", "callout--note", "callout--caution"],
    span: ["callout__label"],
  },
  transformTags: {
    a: (tagName, attribs) => {
      const href = attribs["href"] ?? "";
      const isExternal = /^https?:\/\//i.test(href);
      return {
        tagName,
        attribs: isExternal
          ? { ...attribs, rel: "noopener noreferrer", target: "_blank" }
          : { ...attribs, rel: "" },
      };
    },
    img: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, loading: "lazy", decoding: "async" },
    }),
  },
  nonTextTags: ["style", "script", "textarea", "option", "noscript"],
};

/** Adds stable ids to h2/h3 so headings can be deep-linked and listed. */
function addHeadingIds(html: string): { html: string; headings: Heading[] } {
  const headings: Heading[] = [];
  const seen = new Map<string, number>();

  const withIds = html.replace(
    /<h([23])>([\s\S]*?)<\/h\1>/g,
    (_match, levelRaw: string, inner: string) => {
      const level = Number(levelRaw) === 3 ? 3 : 2;
      const text = inner.replace(/<[^>]+>/g, "").trim();
      const base = slugify(text);
      const count = seen.get(base) ?? 0;
      seen.set(base, count + 1);
      const id = count === 0 ? base : `${base}-${count + 1}`;

      headings.push({ id, text, level });
      return `<h${level} id="${id}">${inner}</h${level}>`;
    },
  );

  return { html: withIds, headings };
}

export function renderMarkdown(markdown: string): {
  html: string;
  headings: Heading[];
} {
  const raw = marked.parse(markdown, { async: false });
  const clean = sanitizeHtml(raw, SANITIZE_OPTIONS);
  return addHeadingIds(clean);
}

/** Plain text, for meta descriptions and reading-time estimates. */
export function markdownToText(markdown: string): string {
  const raw = marked.parse(markdown, { async: false });
  return sanitizeHtml(raw, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
}

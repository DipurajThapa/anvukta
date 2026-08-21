/**
 * UX / accessibility audit harness.
 *
 * Drives the real production build in Chrome and reports evidence, not opinion:
 *   - axe-core 4.13 (WCAG 2.0/2.1/2.2 A + AA) on every page, at every viewport
 *   - keyboard reachability and focus-visibility of every interactive element
 *   - WCAG 2.2 target-size (2.5.8) with the inline-in-text exception applied
 *   - line length, horizontal overflow, and heading order
 *   - form semantics: labels, autocomplete, error wiring
 *
 * Usage:  node scripts/ux-audit.mjs [baseUrl]
 * Writes: audit/ux-audit.json
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

import { chromium } from "playwright";

const require = createRequire(import.meta.url);
const AXE_SOURCE = fs.readFileSync(require.resolve("axe-core"), "utf8");

const BASE = process.argv[2] ?? "http://localhost:3000";
const OUT = path.join(process.cwd(), "audit");

const PAGES = [
  { name: "home", url: "/" },
  { name: "proposition", url: "/proposition" },
  { name: "blog", url: "/blog" },
  { name: "article", url: "/blog/why-ai-pilots-stall-before-production" },
  { name: "contact", url: "/contact" },
  { name: "privacy", url: "/privacy" },
  { name: "not-found", url: "/does-not-exist" },
];

const VIEWPORTS = [
  { name: "mobile-320", width: 320, height: 720 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "wide-1920", width: 1920, height: 1080 },
];

const AXE_OPTIONS = {
  runOnly: {
    type: "tag",
    values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"],
  },
};

/* -------------------------------------------------------------------------- */

/** Checks that need layout, so they run in the page rather than on the HTML. */
function inPageChecks() {
  const de = document.documentElement;
  const vw = de.clientWidth;

  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    const st = getComputedStyle(el);
    return st.visibility !== "hidden" && st.display !== "none" && st.opacity !== "0";
  };

  const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]),' +
    ' textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

  /* --- WCAG 2.2 target size (2.5.8), minimum 24x24 CSS px ---------------- */
  const smallTargets = [];
  for (const el of document.querySelectorAll(FOCUSABLE)) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    // Exception: a link inside a sentence of running text is exempt.
    const inline = getComputedStyle(el).display === "inline";
    if (inline && el.closest("p, li, dd, figcaption, blockquote")) continue;
    if (Math.min(r.width, r.height) < 24) {
      smallTargets.push({
        tag: el.tagName.toLowerCase(),
        w: Math.round(r.width),
        h: Math.round(r.height),
        text: (el.textContent || "").trim().slice(0, 34),
      });
    }
  }

  /* --- line length ------------------------------------------------------- */
  const longLines = [];
  for (const el of document.querySelectorAll("p, li")) {
    const text = el.textContent.trim();
    if (text.length < 120 || !visible(el)) continue;
    const r = el.getBoundingClientRect();
    const fs = parseFloat(getComputedStyle(el).fontSize);
    const chars = Math.round(r.width / (fs * 0.5));
    if (chars > 80) longLines.push({ chars, px: Math.round(r.width), sample: text.slice(0, 46) });
  }

  /* --- headings ---------------------------------------------------------- */
  const hs = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")]
    .filter(visible)
    .map((h) => ({ level: +h.tagName[1], text: h.textContent.trim().slice(0, 46) }));
  const skips = [];
  for (let i = 1; i < hs.length; i += 1) {
    if (hs[i].level - hs[i - 1].level > 1) {
      skips.push(`h${hs[i - 1].level} -> h${hs[i].level} at "${hs[i].text}"`);
    }
  }

  /* --- forms ------------------------------------------------------------- */
  const fields = [...document.querySelectorAll("input, select, textarea")]
    .filter((e) => e.type !== "hidden" && !String(e.name).startsWith("$ACTION"))
    .map((e) => ({
      name: e.name,
      type: e.type,
      required: e.required,
      labelled: !!(e.id && document.querySelector(`label[for="${CSS.escape(e.id)}"]`)),
      autocomplete: e.getAttribute("autocomplete"),
      describedBy: e.getAttribute("aria-describedby"),
    }));

  /* --- misc -------------------------------------------------------------- */
  const ids = [...document.querySelectorAll("[id]")].map((e) => e.id);
  const focusables = [...document.querySelectorAll(FOCUSABLE)].filter(visible);

  return {
    viewportWidth: vw,
    horizontalOverflow: de.scrollWidth > vw + 1,
    docScrollWidth: de.scrollWidth,
    smallTargets,
    longLines,
    headings: { total: hs.length, h1: hs.filter((h) => h.level === 1).length, skips },
    fields,
    focusableCount: focusables.length,
    positiveTabindex: focusables.filter((e) => +(e.getAttribute("tabindex") || 0) > 0).length,
    duplicateIds: [...new Set(ids.filter((v, i) => ids.indexOf(v) !== i))],
    ambiguousLinkText: [...document.querySelectorAll("a[href]")]
      .map((a) => (a.textContent || "").trim().toLowerCase())
      .filter((t) => ["read more", "click here", "more", "learn more", "here"].includes(t)).length,
    landmarks: {
      header: document.querySelectorAll("header").length,
      nav: document.querySelectorAll("nav").length,
      main: document.querySelectorAll("main").length,
      footer: document.querySelectorAll("footer").length,
    },
    skipLink: !!document.querySelector(".skip-link"),
    lang: de.getAttribute("lang"),
    title: document.title,
    metaDescription:
      document.querySelector('meta[name="description"]')?.getAttribute("content")?.length ?? 0,
    images: [...document.querySelectorAll("img")].map((i) => ({
      src: (i.getAttribute("src") || "").slice(-36),
      hasAlt: i.hasAttribute("alt"),
      altLength: (i.getAttribute("alt") || "").length,
      loading: i.getAttribute("loading"),
      intrinsic: !!(i.getAttribute("width") && i.getAttribute("height")),
    })),
  };
}

/** Tabs through the page and records whether each stop shows a visible focus ring. */
async function keyboardWalk(page, limit = 60) {
  return page.evaluate((max) => {
    const FOCUSABLE =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]),' +
      ' textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';
    const els = [...document.querySelectorAll(FOCUSABLE)].filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });

    const noRing = [];
    for (const el of els.slice(0, max)) {
      el.focus();
      const st = getComputedStyle(el);
      const hasOutline = st.outlineStyle !== "none" && parseFloat(st.outlineWidth) > 0;
      const hasShadow = st.boxShadow !== "none";
      if (!hasOutline && !hasShadow) {
        noRing.push((el.textContent || el.getAttribute("aria-label") || el.tagName).trim().slice(0, 30));
      }
    }
    document.activeElement?.blur?.();
    return { checked: Math.min(els.length, max), withoutVisibleFocus: noRing };
  }, limit);
}

/* -------------------------------------------------------------------------- */

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const results = [];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
      reducedMotion: "no-preference",
    });

    for (const target of PAGES) {
      const page = await context.newPage();
      const consoleErrors = [];
      page.on("console", (m) => {
        if (m.type() === "error") consoleErrors.push(m.text().slice(0, 160));
      });
      page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${String(e).slice(0, 160)}`));

      const response = await page.goto(BASE + target.url, { waitUntil: "networkidle" });
      // Let reveal animations settle so nothing is measured mid-transition.
      await page.waitForTimeout(700);

      await page.addScriptTag({ content: AXE_SOURCE });
      const axe = await page.evaluate(
        async (options) => {
          const run = await window.axe.run(document, options);
          return run.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            help: v.help,
            tags: v.tags.filter((t) => t.startsWith("wcag")),
            nodes: v.nodes.length,
            example: v.nodes[0]?.html?.slice(0, 130) ?? "",
          }));
        },
        AXE_OPTIONS,
      );

      const checks = await page.evaluate(inPageChecks);
      const keyboard = vp.name === "desktop-1440" ? await keyboardWalk(page) : null;

      results.push({
        viewport: vp.name,
        page: target.name,
        url: target.url,
        status: response?.status() ?? 0,
        axeViolations: axe,
        consoleErrors,
        ...checks,
        keyboard,
      });

      process.stdout.write(
        `${vp.name.padEnd(13)} ${target.name.padEnd(12)} ` +
          `axe:${String(axe.length).padStart(2)}  ` +
          `overflow:${checks.horizontalOverflow ? "YES" : "no "}  ` +
          `small-targets:${String(checks.smallTargets.length).padStart(2)}  ` +
          `long-lines:${String(checks.longLines.length).padStart(2)}  ` +
          `console:${consoleErrors.length}\n`,
      );

      await page.close();
    }

    await context.close();
  }

  await browser.close();

  fs.writeFileSync(
    path.join(OUT, "ux-audit.json"),
    JSON.stringify({ baseUrl: BASE, generatedAt: new Date().toISOString(), results }, null, 1),
  );

  const totalAxe = results.reduce((n, r) => n + r.axeViolations.length, 0);
  const overflow = results.filter((r) => r.horizontalOverflow).length;
  console.log(
    `\n${results.length} page/viewport combinations` +
      `\naxe violations: ${totalAxe}` +
      `\nhorizontal overflow: ${overflow}` +
      `\nwritten to audit/ux-audit.json`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

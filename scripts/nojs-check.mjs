/**
 * Progressive-enhancement check: what still works with JavaScript disabled.
 * A server-rendered site should degrade to a usable one, not a blank page.
 */
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3000";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

for (const url of ["/", "/proposition", "/blog", "/contact"]) {
  await page.goto(BASE + url, { waitUntil: "domcontentloaded" });
  const r = await page.evaluate(() => ({
    words: (document.querySelector("main")?.innerText || "").split(/\s+/).filter(Boolean).length,
    headings: document.querySelectorAll("main h1, main h2, main h3").length,
    links: document.querySelectorAll("main a[href]").length,
    hiddenReveals: [...document.querySelectorAll("[data-reveal]")].filter(
      (e) => parseFloat(getComputedStyle(e).opacity) < 0.99,
    ).length,
    revealTotal: document.querySelectorAll("[data-reveal]").length,
    details: document.querySelectorAll("details").length,
    formAction: document.querySelector("main form")?.getAttribute("action") ?? null,
  }));
  console.log(
    `${url.padEnd(14)} words:${String(r.words).padStart(4)}  headings:${String(r.headings).padStart(2)}  ` +
      `links:${String(r.links).padStart(2)}  reveals hidden:${r.hiddenReveals}/${r.revealTotal}  ` +
      `details:${r.details}  form action:${r.formAction}`,
  );
}

await browser.close();

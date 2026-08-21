/** Does the engagement ring follow the reader down the five stages? */
import { chromium } from "playwright";
const BASE = process.argv[2] ?? "http://localhost:3000";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: "networkidle" });

const count = await page.evaluate(() => document.querySelectorAll("[data-stage-index]").length);
console.log(`stage entries: ${count}`);

const read = () =>
  page.evaluate(() => {
    const svg = document.querySelector('svg[aria-labelledby="engagement-ring-title"]');
    const fill = svg.querySelector(".ring-fill");
    const total = 2 * Math.PI * 122;
    let lit = -1;
    svg.querySelectorAll(".ring-node").forEach((n, i) => {
      if (n.getAttribute("fill") === "var(--color-accent)") lit = i;
    });
    return {
      stage: svg.querySelector(".ring-stage")?.textContent,
      lit: lit + 1,
      pct: Math.round((1 - parseFloat(fill.getAttribute("stroke-dashoffset")) / total) * 100),
    };
  });

for (let i = 0; i < count; i += 1) {
  // Put this step's top exactly on the reading line (42% of the viewport).
  await page.evaluate((index) => {
    const el = document.querySelectorAll("[data-stage-index]")[index];
    const y = el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.42 + 4;
    window.scrollTo({ top: y, behavior: "instant" });
  }, i);
  await page.waitForTimeout(850);
  const r = await read();
  const ok = r.lit === i + 1 ? "OK  " : "MISS";
  console.log(`${ok} step ${i + 1}: centre "${r.stage}", node ${r.lit} lit, arc ${r.pct}%`);
}

await browser.close();

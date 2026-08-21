/**
 * Typography and pattern consistency audit.
 * Reports every distinct font family / size / weight / letter-spacing actually
 * rendered, and where each one comes from, so drift is visible.
 */
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3000";
const PAGES = ["/", "/proposition", "/blog", "/blog/why-ai-pilots-stall-before-production", "/contact", "/privacy"];

const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const styles = new Map();
const iconSizes = new Map();
const radii = new Map();

for (const url of PAGES) {
  await page.goto(BASE + url, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  const found = await page.evaluate(() => {
    const text = [];
    const icons = [];
    const corners = [];

    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const st = getComputedStyle(el);

      if (el.tagName === "svg") {
        icons.push(`${Math.round(r.width)}x${Math.round(r.height)}`);
        continue;
      }

      const own = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).length;
      if (!own) {
        if (st.borderRadius !== "0px" && st.borderRadius !== "0%") corners.push(st.borderRadius);
        continue;
      }

      const family = st.fontFamily.split(",")[0].replace(/["']/g, "").trim();
      text.push({
        key: `${family} | ${st.fontSize} | ${st.fontWeight} | ${st.letterSpacing} | ${st.textTransform}`,
        sample: el.textContent.trim().slice(0, 28),
        cls: (typeof el.className === "string" ? el.className : "").split(" ").filter((c) => c.startsWith("t-") || c === "prose").join(" "),
      });
      if (st.borderRadius !== "0px" && st.borderRadius !== "0%") corners.push(st.borderRadius);
    }
    return { text, icons, corners };
  });

  for (const t of found.text) {
    if (!styles.has(t.key)) styles.set(t.key, { count: 0, pages: new Set(), sample: t.sample, cls: new Set() });
    const e = styles.get(t.key);
    e.count += 1;
    e.pages.add(url);
    if (t.cls) e.cls.add(t.cls);
  }
  for (const i of found.icons) iconSizes.set(i, (iconSizes.get(i) ?? 0) + 1);
  for (const c of found.corners) radii.set(c, (radii.get(c) ?? 0) + 1);
}

await browser.close();

console.log(`\n=== TEXT STYLES IN USE (${styles.size} distinct) ===`);
const rows = [...styles.entries()].sort((a, b) => b[1].count - a[1].count);
for (const [key, v] of rows) {
  const [family, size, weight, spacing, transform] = key.split(" | ");
  console.log(
    `${String(v.count).padStart(4)}x  ${family.padEnd(18)} ${size.padStart(8)}  w${weight.padEnd(4)} ` +
      `ls:${spacing.padEnd(9)} ${transform === "none" ? "        " : transform.padEnd(8)} ` +
      `[${[...v.cls].join(",") || "no token class"}]  "${v.sample}"`,
  );
}

console.log(`\n=== SVG SIZES (${iconSizes.size} distinct) ===`);
for (const [k, n] of [...iconSizes.entries()].sort((a, b) => b[1] - a[1])) console.log(`${String(n).padStart(4)}x  ${k}`);

console.log(`\n=== BORDER RADII (${radii.size} distinct) ===`);
for (const [k, n] of [...radii.entries()].sort((a, b) => b[1] - a[1])) console.log(`${String(n).padStart(4)}x  ${k}`);

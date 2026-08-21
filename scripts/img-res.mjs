import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome", headless: true });
for (const dpr of [1, 2]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: dpr });
  const page = await ctx.newPage();
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  const r = await page.evaluate(() => {
    const i = document.querySelector("img");
    return {
      css: Math.round(i.getBoundingClientRect().width),
      natural: i.naturalWidth,
      chosen: (i.currentSrc || "").match(/w=(\d+)/)?.[1],
      sizes: i.getAttribute("sizes"),
      candidates: (i.getAttribute("srcset") || "").match(/w=(\d+)/g)?.join(" "),
    };
  });
  console.log(`dpr ${dpr}: css ${r.css}px, chose w=${r.chosen}, decoded ${r.natural}px  (ratio ${(r.natural / r.css).toFixed(2)}x)`);
  console.log(`        sizes="${r.sizes}"  candidates: ${r.candidates}`);
  await ctx.close();
}
await browser.close();

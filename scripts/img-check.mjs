/** Scrolls each page to the bottom and confirms every image actually decodes. */
import { chromium } from "playwright";
const BASE = process.argv[2] ?? "http://localhost:3000";
const browser = await chromium.launch({ channel: "chrome", headless: true });

for (const vp of [{ n: "mobile", w: 390, h: 844 }, { n: "desktop", w: 1440, h: 900 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const failed = [];
  page.on("response", (r) => {
    if (r.url().includes("/_next/image") && r.status() >= 400) failed.push(`${r.status()} ${r.url().slice(-60)}`);
  });

  for (const url of ["/", "/proposition"]) {
    await page.goto(BASE + url, { waitUntil: "networkidle" });
    // Walk down the page so every lazy image enters the viewport.
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.8;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 220));
      }
    });
    await page.waitForTimeout(1500);

    const imgs = await page.evaluate(() =>
      [...document.querySelectorAll("img")].map((i) => ({
        file: (i.getAttribute("src") || "").split("%2F").pop()?.split("&")[0] ?? "?",
        ok: i.complete && i.naturalWidth > 0,
        natural: `${i.naturalWidth}x${i.naturalHeight}`,
        type: (i.currentSrc || "").includes("q=") ? "optimised" : "raw",
      })),
    );
    console.log(`${vp.n.padEnd(8)} ${url.padEnd(14)}`, imgs.map((i) => `${i.file}:${i.ok ? i.natural : "FAILED"}`).join("  "));
  }

  if (failed.length) console.log("  image request failures:", failed);
  await ctx.close();
}
await browser.close();

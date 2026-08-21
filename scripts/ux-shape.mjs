/** Page shape: length, scroll depth, CTA density, and what lands above the fold. */
import { chromium } from "playwright";
const BASE = process.argv[2] ?? "http://localhost:3000";
const browser = await chromium.launch({ channel: "chrome", headless: true });

for (const vp of [{ n: "mobile", w: 390, h: 844 }, { n: "desktop", w: 1440, h: 900 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
  const page = await ctx.newPage();
  console.log(`\n--- ${vp.n} ${vp.w}x${vp.h} ---`);
  for (const url of ["/", "/proposition", "/blog", "/contact"]) {
    await page.goto(BASE + url, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const r = await page.evaluate((vh) => {
      const h = document.documentElement.scrollHeight;
      const ctas = [...document.querySelectorAll('a[href="/contact"], a[href^="mailto"]')];
      const aboveFold = [...document.querySelectorAll("main *")].filter((el) => {
        const b = el.getBoundingClientRect();
        return b.top < vh && b.bottom > 0 && (el.textContent || "").trim().length > 0;
      });
      const firstCta = ctas.find((c) => c.getBoundingClientRect().top < vh);
      return {
        height: h,
        screens: +(h / vh).toFixed(1),
        sections: document.querySelectorAll("main > section, main > div").length,
        ctas: ctas.length,
        ctaAboveFold: !!firstCta,
        firstCtaY: ctas.length ? Math.round(ctas[0].getBoundingClientRect().top + scrollY) : null,
        h1: document.querySelector("h1")?.textContent.trim().slice(0, 44) ?? null,
        foldWords: aboveFold.length
          ? (document.querySelector("main").innerText || "").slice(0, 260).replace(/\s+/g, " ")
          : "",
      };
    }, vp.h);
    console.log(
      `${url.padEnd(14)} ${String(r.height).padStart(6)}px = ${String(r.screens).padStart(4)} screens  ` +
        `sections:${String(r.sections).padStart(2)}  contact-CTAs:${String(r.ctas).padStart(2)}  ` +
        `CTA above fold:${r.ctaAboveFold ? "yes" : "NO "}  first CTA at ${r.firstCtaY}px`,
    );
  }
  await ctx.close();
}
await browser.close();

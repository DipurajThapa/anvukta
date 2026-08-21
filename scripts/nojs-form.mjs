/**
 * Does the contact form still work with JavaScript disabled?
 * Next.js server actions can progressively enhance; useActionState may not.
 */
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3000";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto(`${BASE}/contact`, { waitUntil: "domcontentloaded" });

const shape = await page.evaluate(() => {
  const f = document.querySelector("main form");
  return {
    method: f.getAttribute("method"),
    action: f.getAttribute("action"),
    actionFields: [...f.querySelectorAll("input[type=hidden]")].map((i) => i.name),
  };
});
console.log("form shape:", JSON.stringify(shape));

await page.fill("#name", "No JS Reviewer");
await page.fill("#email", "nojs@example.com");
await page.fill("#company", "Example Holdings");
await page.fill("#message", "Submitted with JavaScript disabled to check progressive enhancement.");
await page.check("#consent");

await Promise.all([
  page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => null),
  page.click('main form button[type="submit"]'),
]);
await page.waitForTimeout(1500);

const after = await page.evaluate(() => ({
  url: location.pathname,
  success: document.querySelector('[role="status"]')?.textContent?.trim().slice(0, 70) ?? null,
  stillHasForm: !!document.querySelector("#name"),
  alert: document.querySelector('[role="alert"]')?.textContent?.trim().slice(0, 70) ?? null,
}));
console.log("after submit:", JSON.stringify(after));

await browser.close();

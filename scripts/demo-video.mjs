/**
 * Records a walkthrough of the site and writes audit/anvukta-demo.webm.
 *
 * Writes two clips, desktop and phone. They stay separate because a recording
 * is fixed to the size its context was created at: narrowing the viewport
 * part-way through pins the page to a corner of the frame and fills the rest
 * with grey. The ffmpeg bundled with Playwright cannot concatenate them, and
 * cannot encode mp4 either, so webm is the format.
 *
 * The site must already be running (npm run build && npm run start).
 * Usage:  node scripts/demo-video.mjs
 */
import fs from "node:fs";
import { chromium } from "playwright";

const BASE = process.env.DEMO_BASE_URL ?? "http://localhost:3000";
const DESKTOP_OUT = "audit/anvukta-demo.webm";
const PHONE_OUT = "audit/anvukta-demo-mobile.webm";
const STAGE = { width: 1440, height: 900 };
const PHONE = { width: 430, height: 900 };

/**
 * Scrolls with requestAnimationFrame so the capture gets real frames. Stepping
 * from Node instead would stutter at one step per round trip.
 */
async function glide(page, target, duration) {
  await page.evaluate(
    ([to, dur]) =>
      new Promise((resolve) => {
        const startY = window.scrollY;
        const endY =
          to === "bottom"
            ? document.documentElement.scrollHeight - window.innerHeight
            : to === "top"
              ? 0
              : to;
        const distance = endY - startY;
        const started = performance.now();
        const ease = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
        const step = (now) => {
          const t = Math.min(1, (now - started) / dur);
          window.scrollTo(0, startY + distance * ease(t));
          if (t < 1) requestAnimationFrame(step);
          else resolve();
        };
        requestAnimationFrame(step);
      }),
    [target, duration],
  );
}

async function tour(page, route, { settle = 1400, scroll = 9000, rest = 900 } = {}) {
  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(settle);
  await glide(page, "bottom", scroll);
  await page.waitForTimeout(rest);
}

fs.mkdirSync("audit", { recursive: true });

async function save(video, out) {
  fs.rmSync(out, { force: true });
  fs.renameSync(await video.path(), out);
  console.log(`${out}  (${(fs.statSync(out).size / 1e6).toFixed(1)} MB)`);
}

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: STAGE,
  recordVideo: { dir: "audit", size: STAGE },
});
const page = await context.newPage();

console.log("home");
await tour(page, "/", { settle: 2400, scroll: 17000, rest: 1200 });

console.log("proposition");
await page.goto(`${BASE}/proposition`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await glide(page, "bottom", 18000);
await page.waitForTimeout(700);
await glide(page, "top", 2600);
await page.waitForTimeout(500);

// Open a capability so the accordion is shown working.
const capability = page.locator("summary").first();
if (await capability.count()) {
  await capability.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await capability.click();
  await page.waitForTimeout(2200);
}

console.log("insights");
await tour(page, "/blog", { scroll: 7000, rest: 700 });

const article = page.locator("main article a").first();
if (await article.count()) {
  await article.click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1700);
  await glide(page, "bottom", 12000);
  await page.waitForTimeout(800);
}

console.log("contact and chat");
await tour(page, "/contact", { scroll: 6500, rest: 700 });
await glide(page, "top", 2000);
await page.waitForTimeout(600);

const launcher = page.getByRole("button", { name: /chat with us/i }).first();
if (await launcher.count()) {
  await launcher.click();
  await page.waitForTimeout(1800);
  // Scope to the panel: the contact form behind it also has a message field.
  const box = page.locator("#chat-input");
  if (await box.count()) {
    await box.click();
    await box.pressSequentially("Which industries have you worked in?", { delay: 55 });
    await page.waitForTimeout(800);
    await box.press("Enter");
    await page.waitForTimeout(5500);
  }
  await page.keyboard.press("Escape");
  await page.waitForTimeout(700);
}

const desktopVideo = page.video();
await context.close();
await save(desktopVideo, DESKTOP_OUT);

console.log("phone");
const phoneContext = await browser.newContext({
  viewport: PHONE,
  recordVideo: { dir: "audit", size: PHONE },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 2,
});
const phone = await phoneContext.newPage();

await phone.goto(`${BASE}/`, { waitUntil: "networkidle" });
await phone.waitForTimeout(1800);

const toggle = phone.getByRole("button", { name: /menu/i }).first();
if (await toggle.count()) {
  await toggle.click();
  await phone.waitForTimeout(2200);
  await phone.keyboard.press("Escape");
  await phone.waitForTimeout(1000);
}
await glide(phone, "bottom", 15000);
await phone.waitForTimeout(1000);

await tour(phone, "/contact", { settle: 1600, scroll: 9000, rest: 1500 });

const phoneVideo = phone.video();
await phoneContext.close();
await browser.close();
await save(phoneVideo, PHONE_OUT);

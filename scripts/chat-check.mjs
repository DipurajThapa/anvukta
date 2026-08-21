/** Drives the chat: retrieval quality, the honest "I don't know", and handover. */
import { chromium } from "playwright";
const BASE = process.argv[2] ?? "http://localhost:3000";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: "networkidle" });

await page.click('button[aria-controls="anvukta-chat"]');
await page.waitForTimeout(900);

const ask = async (question) => {
  await page.fill("#chat-input", question);
  await page.click('#anvukta-chat form button[type="submit"]');
  await page.waitForTimeout(1600);
  return page.evaluate(() => {
    const items = [...document.querySelectorAll("#anvukta-chat ol > li")];
    const last = items.at(-1);
    return {
      topic: last?.querySelector(".t-label")?.textContent?.trim() ?? null,
      body: last?.querySelector("p:last-of-type")?.textContent?.trim().slice(0, 90) ?? "",
      hasSource: !!last?.querySelector('a[href^="/"]'),
    };
  });
};

const QUESTIONS = [
  "What do you actually do?",
  "how much does it cost",
  "our AI pilot is stuck",
  "which industries have you worked in",
  "can I stop halfway through",
  "what is the airspeed velocity of an unladen swallow",
];

for (const q of QUESTIONS) {
  const r = await ask(q);
  console.log(
    `${r.hasSource ? "ANSWER " : "NO-MATCH"} "${q}"\n    ${r.topic ? `[${r.topic}] ` : ""}${r.body}`,
  );
}

const offered = await page.evaluate(() =>
  [...document.querySelectorAll("#anvukta-chat button")].some((b) =>
    b.textContent.includes("Get me a person"),
  ),
);
console.log(`\nOffers a person after failing: ${offered}`);

if (offered) {
  await page.click('#anvukta-chat button:has-text("Get me a person")');
  await page.waitForTimeout(400);
  await page.fill("#chat-name", "Test Visitor");
  await page.fill("#chat-email", "visitor@example.com");
  await page.click('#anvukta-chat button:has-text("Ask for a person")');
  await page.waitForTimeout(1600);
  const state = await page.evaluate(() => ({
    header: document.querySelector("#anvukta-chat .t-label")?.textContent?.trim(),
    last: [...document.querySelectorAll("#anvukta-chat ol > li")].at(-1)?.textContent?.trim().slice(0, 80),
  }));
  console.log(`After handover: header "${state.header}"\n    ${state.last}`);
}

await browser.close();

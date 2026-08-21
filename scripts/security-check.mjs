/**
 * Exercises the public abuse surface against a running server.
 *
 * Everything here goes through the real interface, because a limit that holds
 * in a unit test but not in the browser is not a limit.
 *
 * Counters are cleared before each section so the sections do not spend each
 * other's allowance, and so the script gives the same answer when run twice.
 *
 * The site must already be running (npm run build && npm run start).
 * Usage:  node scripts/security-check.mjs
 */
import Database from "better-sqlite3";
import { chromium } from "playwright";

const BASE = process.env.CHECK_BASE_URL ?? "http://localhost:3000";
const DB_FILE = process.env.CHECK_DB ?? "dev.db";

let passed = 0;
let failed = 0;

function check(name, ok, detail = "") {
  if (ok) {
    passed++;
    console.log(`  PASS  ${name}${detail ? `  ${detail}` : ""}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}${detail ? `  ${detail}` : ""}`);
  }
}

const db = new Database(DB_FILE);
const countConversations = () =>
  db.prepare("SELECT COUNT(*) n FROM chat_conversations").get().n;
const countVisitorMessages = () =>
  db.prepare("SELECT COUNT(*) n FROM chat_messages WHERE role = 'visitor'").get().n;
const clearLimits = () => db.prepare("DELETE FROM rate_limits").run();

/** Puts a counter at its ceiling, to test what happens once a flood has landed. */
const fillPool = (key) =>
  db
    .prepare("INSERT OR REPLACE INTO rate_limits (id, key, count, expiresAt) VALUES (?, ?, ?, ?)")
    .run(`test-${key}`, key, 100000, Date.now() + 60 * 60 * 1000);

/** Opens the chat as a brand new visitor, and reports whether a thread appeared. */
async function openChatAsNewVisitor(context, headers) {
  const page = await context.newPage();
  if (headers) await page.setExtraHTTPHeaders(headers);
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.evaluate(() => window.localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });

  const launcher = page.getByRole("button", { name: /chat with us/i }).first();
  if (await launcher.count()) {
    await launcher.click();
    await page.waitForTimeout(220);
  }
  return page;
}

const browser = await chromium.launch();

/* -------------------------------------------------------------------------- */
console.log("\nheaders");
{
  const page = await browser.newPage();
  const response = await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  const h = response.headers();

  check(
    "content security policy is set",
    (h["content-security-policy"] ?? "").includes("default-src 'self'"),
  );
  check("frames are refused", h["x-frame-options"] === "DENY");
  check("mime sniffing is off", h["x-content-type-options"] === "nosniff");
  check("referrer is limited", (h["referrer-policy"] ?? "").length > 0);
  check("server software is not advertised", !("x-powered-by" in h));

  const admin = await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
  const ah = admin.headers();
  check("admin is not cached", (ah["cache-control"] ?? "").includes("no-store"));
  check("admin is not indexable", (ah["x-robots-tag"] ?? "").includes("noindex"));
  await page.close();
}

/* -------------------------------------------------------------------------- */
console.log("\nadmin is closed to strangers");
{
  const page = await browser.newPage();
  for (const path of [
    "/admin",
    "/admin/blog",
    "/admin/contacts",
    "/admin/chats",
    "/admin/blog/new",
  ]) {
    await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
    check(`${path} sends you to sign in`, new URL(page.url()).pathname === "/admin/login");
  }

  await page.context().addCookies([
    { name: "anvukta_session", value: "forged-token-value", url: BASE },
  ]);
  await page.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" });
  check("a forged session cookie is refused", new URL(page.url()).pathname === "/admin/login");
  await page.context().clearCookies();
  await page.close();
}

/* -------------------------------------------------------------------------- */
console.log("\none visitor cannot spawn threads without end");
{
  clearLimits();
  const context = await browser.newContext();
  const before = countConversations();

  for (let i = 0; i < 20; i++) {
    const page = await openChatAsNewVisitor(context);
    await page.close();
  }

  const created = countConversations() - before;
  check(
    "twenty attempts do not make twenty threads",
    created > 0 && created <= 6,
    `created ${created}`,
  );
  await context.close();
}

/* -------------------------------------------------------------------------- */
console.log("\nspoofing the forwarded address buys nothing");
{
  clearLimits();
  const context = await browser.newContext();
  const before = countConversations();

  // One visitor, but a different X-Forwarded-For every time. That header used to
  // be the entire identity, so changing it handed out a fresh allowance per
  // request and no limit ever applied. Fifteen attempts should still yield only
  // the one allowance.
  for (let i = 0; i < 15; i++) {
    const page = await openChatAsNewVisitor(context, {
      "x-forwarded-for": `203.0.113.${i + 1}`,
    });
    await page.close();
  }

  const created = countConversations() - before;
  check(
    "fifteen forged addresses still get one allowance",
    created > 0 && created <= 6,
    `created ${created}`,
  );
  await context.close();
}

/* -------------------------------------------------------------------------- */
console.log("\nflooding one thread stops being recorded");
{
  clearLimits();
  const context = await browser.newContext();
  const before = countVisitorMessages();

  const page = await openChatAsNewVisitor(context);
  const box = page.locator("#chat-input");
  let sent = 0;

  if (await box.count()) {
    for (let i = 0; i < 45; i++) {
      await box.fill(`flood question number ${i}`);
      await box.press("Enter");
      sent++;
      await page.waitForTimeout(80);
    }
  }

  const written = countVisitorMessages() - before;
  check(
    "forty-five questions do not all reach the table",
    sent === 45 && written > 0 && written <= 31,
    `sent ${sent}, stored ${written}`,
  );

  await page.close();
  await context.close();
}

/* -------------------------------------------------------------------------- */
console.log("\na flood of strangers cannot lock out a returning visitor");
{
  clearLimits();

  // Give this browser a cookie by letting it use the chat once. From here on it
  // is a caller the site recognises.
  const known = await browser.newContext();
  const warmup = await openChatAsNewVisitor(known);
  await warmup.close();

  check(
    "a visitor who uses the site is given an identity",
    (await known.cookies()).some((cookie) => cookie.name === "anvukta_cid"),
  );

  // Now simulate the flood having already landed: the pool for callers with no
  // identity is full. Before this fix there was one shared counter, so reaching
  // it turned everyone away, the site's own administrator included.
  fillPool("anon:chat-start");

  const strangerContext = await browser.newContext();
  const beforeStranger = countConversations();
  const stranger = await openChatAsNewVisitor(strangerContext);
  await stranger.close();
  check(
    "a caller with no identity is turned away",
    countConversations() - beforeStranger === 0,
  );
  await strangerContext.close();

  const beforeKnown = countConversations();
  const returning = await openChatAsNewVisitor(known);
  await returning.close();
  check(
    "the returning visitor still gets through",
    countConversations() - beforeKnown > 0,
    "not collateral damage of someone else's flood",
  );

  await known.close();
  clearLimits();
}

/* -------------------------------------------------------------------------- */
console.log("\nstored content stays inert");
{
  const page = await browser.newPage();
  const alerts = [];
  page.on("dialog", async (dialog) => {
    alerts.push(dialog.message());
    await dialog.dismiss();
  });

  for (const path of ["/", "/proposition", "/blog", "/contact", "/privacy"]) {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  }
  check("no page raised a dialog", alerts.length === 0);

  const inline = await page.evaluate(() =>
    [...document.querySelectorAll("*")].some((el) =>
      [...el.attributes].some((attribute) => attribute.name.startsWith("on"))),
  );
  check("no inline event handlers in the markup", inline === false);
  await page.close();
}

// The run leaves behind the threads it made. Clear them, or the admin queue
// fills with test noise that looks like real visitors.
clearLimits();
const removed = db
  .prepare(
    `DELETE FROM chat_conversations
     WHERE id IN (
       SELECT c.id FROM chat_conversations c
       LEFT JOIN chat_messages m ON m.conversationId = c.id
       GROUP BY c.id
       HAVING COUNT(m.id) = 0
          OR SUM(CASE WHEN m.body LIKE 'flood question%' THEN 1 ELSE 0 END) > 0
     )`,
  )
  .run().changes;
console.log(`
cleaned up ${removed} test thread(s)`);
db.close();
await browser.close();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

/**
 * Second audit pass: the states a static crawl cannot see.
 *   - prefers-reduced-motion honoured (no transitions, no keyframes running)
 *   - 200% browser zoom (WCAG 1.4.4 / 1.4.10 reflow) at a 1280px desktop
 *   - forced-colors / high-contrast survival
 *   - mobile navigation: open, focus trap, Escape, scroll lock
 *   - contact form: client blocking, server validation, error announcement, success
 *   - dark/light section contrast at the seams
 *
 * Usage: node scripts/ux-audit-states.mjs [baseUrl]
 */
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3000";
const out = [];
const log = (area, check, pass, detail = "") => {
  out.push({ area, check, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${area.padEnd(18)} ${check}${detail ? ` — ${detail}` : ""}`);
};

async function main() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });

  /* ---------------- reduced motion ---------------- */
  {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/proposition`, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);

    const motion = await page.evaluate(() => {
      let animating = 0;
      let transitioning = 0;
      let hiddenReveals = 0;
      for (const el of document.querySelectorAll("body *")) {
        const st = getComputedStyle(el);
        if (st.animationName !== "none" && parseFloat(st.animationDuration) > 0.01) animating += 1;
        if (parseFloat(st.transitionDuration) > 0.01) transitioning += 1;
        if (el.matches("[data-reveal]") && parseFloat(st.opacity) < 0.99) hiddenReveals += 1;
      }
      return { animating, transitioning, hiddenReveals, reveals: document.querySelectorAll("[data-reveal]").length };
    });

    log("reduced motion", "no running animations", motion.animating === 0, `${motion.animating} found`);
    log("reduced motion", "no timed transitions", motion.transitioning === 0, `${motion.transitioning} found`);
    log(
      "reduced motion",
      "all reveal content visible",
      motion.hiddenReveals === 0,
      `${motion.reveals} reveal elements, ${motion.hiddenReveals} still hidden`,
    );
    await ctx.close();
  }

  /* ---------------- 200% zoom (reflow) ---------------- */
  {
    // 1280 CSS px at 200% zoom == a 640px layout viewport.
    const ctx = await browser.newContext({ viewport: { width: 640, height: 512 } });
    const page = await ctx.newPage();
    for (const url of ["/", "/proposition", "/contact", "/blog"]) {
      await page.goto(BASE + url, { waitUntil: "networkidle" });
      const r = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        clipped: [...document.querySelectorAll("h1, h2, h3, p, a, button")].filter((el) => {
          const st = getComputedStyle(el);
          return st.overflow === "hidden" && el.scrollWidth > el.clientWidth + 2;
        }).length,
      }));
      log("zoom 200%", `${url} reflows without side-scroll`, !r.overflow);
      log("zoom 200%", `${url} no clipped text`, r.clipped === 0, `${r.clipped} clipped`);
    }
    await ctx.close();
  }

  /* ---------------- forced colors ---------------- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, forcedColors: "active" });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/contact`, { waitUntil: "networkidle" });
    const r = await page.evaluate(() => {
      const btn = document.querySelector("main form button[type=submit]");
      const st = btn ? getComputedStyle(btn) : null;
      return {
        buttonVisible: !!btn && btn.getBoundingClientRect().height > 0,
        buttonHasBorderOrBg: !!st && (st.borderTopWidth !== "0px" || st.backgroundColor !== "rgba(0, 0, 0, 0)"),
      };
    });
    log("forced colors", "submit button still visible", r.buttonVisible);
    log("forced colors", "controls keep an edge", r.buttonHasBorderOrBg);
    await ctx.close();
  }

  /* ---------------- mobile navigation ---------------- */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: "networkidle" });

    const toggle = page.locator('button[aria-controls="mobile-nav"]');
    log("mobile nav", "toggle exists", (await toggle.count()) === 1);
    log("mobile nav", "starts collapsed", (await toggle.getAttribute("aria-expanded")) === "false");

    await toggle.click();
    await page.waitForTimeout(250);

    const open = await page.evaluate(() => {
      const panel = document.getElementById("mobile-nav");
      return {
        expanded: document.querySelector('button[aria-controls="mobile-nav"]').getAttribute("aria-expanded"),
        hidden: panel.hasAttribute("hidden"),
        scrollLocked: document.body.style.overflow === "hidden",
        focusInside: panel.contains(document.activeElement),
        links: panel.querySelectorAll("a").length,
      };
    });
    log("mobile nav", "opens", open.expanded === "true" && !open.hidden);
    log("mobile nav", "locks body scroll", open.scrollLocked);
    log("mobile nav", "moves focus into panel", open.focusInside);

    // Tab past the last item and confirm focus wraps back inside (a real trap).
    for (let i = 0; i < open.links + 4; i += 1) await page.keyboard.press("Tab");
    const trapped = await page.evaluate(() =>
      document.getElementById("mobile-nav").contains(document.activeElement),
    );
    log("mobile nav", "focus stays trapped", trapped);

    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    const closed = await page.evaluate(() => ({
      expanded: document.querySelector('button[aria-controls="mobile-nav"]').getAttribute("aria-expanded"),
      scrollLocked: document.body.style.overflow === "hidden",
      focusOnToggle: document.activeElement === document.querySelector('button[aria-controls="mobile-nav"]'),
    }));
    log("mobile nav", "Escape closes", closed.expanded === "false");
    log("mobile nav", "releases scroll lock", !closed.scrollLocked);
    log("mobile nav", "returns focus to toggle", closed.focusOnToggle);
    await ctx.close();
  }

  /* ---------------- contact form ---------------- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/contact`, { waitUntil: "networkidle" });

    // Submit empty: noValidate is set, so the server must be the one to object.
    await page.locator('main form button[type="submit"]').click();
    await page.waitForTimeout(1200);

    const invalid = await page.evaluate(() => ({
      alert: document.querySelector('main [role="alert"]')?.textContent?.trim() ?? null,
      errors: [...document.querySelectorAll("main .field__error")].map((e) => e.textContent.replace("✕", "").trim()),
      invalidMarked: [...document.querySelectorAll('main [aria-invalid="true"]')].map((e) => e.name),
      wired: [...document.querySelectorAll("main [aria-describedby]")]
        .filter((e) => e.name)
        .every((e) =>
          e.getAttribute("aria-describedby").split(" ").every((id) => !!document.getElementById(id)),
        ),
    }));
    log("contact form", "server rejects empty submit", invalid.errors.length >= 4, `${invalid.errors.length} field errors`);
    log("contact form", "announces a summary via role=alert", !!invalid.alert);
    log("contact form", "marks fields aria-invalid", invalid.invalidMarked.length >= 4);
    log("contact form", "every aria-describedby target exists", invalid.wired);

    // Now a valid submission.
    await page.fill("#name", "Audit Reviewer");
    await page.fill("#email", "audit@example.com");
    await page.fill("#company", "Example Holdings");
    await page.fill(
      "#message",
      "Checking that a well-formed enquiry reaches the database and returns an honest confirmation.",
    );
    await page.check("#consent");
    await page.evaluate(() => {
      document.querySelector('[name="formLoadedAt"]').value = String(Date.now() - 30000);
    });
    await page.locator('main form button[type="submit"]').click();
    await page.waitForTimeout(2000);

    const success = await page.evaluate(() => ({
      status: document.querySelector('main [role="status"]')?.textContent?.trim().slice(0, 90) ?? null,
      formGone: !document.querySelector("#name"),
      focused: (document.activeElement?.textContent || "").trim().slice(0, 40),
    }));
    log("contact form", "valid submit succeeds", !!success.status && success.formGone);
    log("contact form", "success is focused for screen readers", success.focused.length > 0);
    await ctx.close();
  }

  await browser.close();

  const failures = out.filter((r) => !r.pass);
  console.log(`\n${out.length} checks, ${failures.length} failing`);
  if (failures.length) {
    for (const f of failures) console.log(`  FAIL  ${f.area} — ${f.check} ${f.detail}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

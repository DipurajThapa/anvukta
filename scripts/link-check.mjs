/**
 * Crawls the running site and reports anything that does not resolve.
 *
 * Covers internal pages, in-page anchors, images, stylesheets, scripts, video
 * sources, the sitemap, the feed, and outbound links. Also flags pages that are
 * published but that nothing links to, since those are dead in practice even
 * though they answer with a 200.
 *
 * The site must already be running (npm run build && npm run start).
 * Usage:  node scripts/link-check.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.LINK_BASE_URL ?? "http://localhost:3000";
const origin = new URL(BASE).origin;

/** Pages behind a sign-in. Reached deliberately, not crawled through. */
const SKIP_PREFIXES = ["/admin"];

const pages = new Map(); // path -> { status, ids:Set, links:[] }
const external = new Map(); // url -> Set of pages that point at it
const problems = [];
const queue = ["/"];
const seen = new Set(queue);

function report(kind, where, detail) {
  problems.push({ kind, where, detail });
}

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

/* -------------------------------------------------------------------------- */
console.log("crawling");

while (queue.length > 0) {
  const path = queue.shift();
  const url = `${origin}${path}`;

  let response;
  try {
    response = await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
  } catch (error) {
    report("page failed to load", path, error.message.split("\n")[0]);
    continue;
  }

  const status = response?.status() ?? 0;

  const harvested = await page.evaluate(() => {
    const abs = (value) => {
      try {
        return new URL(value, location.href).href;
      } catch {
        return null;
      }
    };

    const links = [...document.querySelectorAll("a[href]")].map((a) => ({
      href: a.getAttribute("href"),
      resolved: abs(a.getAttribute("href")),
      text: (a.textContent ?? "").trim().slice(0, 60),
      target: a.getAttribute("target"),
      rel: a.getAttribute("rel"),
    }));

    const assets = [];
    for (const [selector, attribute, kind] of [
      ["img[src]", "src", "image"],
      ["source[src]", "src", "video source"],
      ["video[src]", "src", "video"],
      ["video[poster]", "poster", "poster"],
      ["link[rel=stylesheet][href]", "href", "stylesheet"],
      ["link[rel=icon][href]", "href", "icon"],
      ["script[src]", "src", "script"],
    ]) {
      for (const el of document.querySelectorAll(selector)) {
        const raw = el.getAttribute(attribute);
        if (raw) assets.push({ kind, raw, resolved: abs(raw) });
      }
    }

    const ids = [...document.querySelectorAll("[id]")].map((el) => el.id);

    return {
      links,
      assets,
      ids,
      title: document.title,
      canonical: document.querySelector("link[rel=canonical]")?.getAttribute("href") ?? null,
    };
  });

  pages.set(path, {
    status,
    ids: new Set(harvested.ids),
    links: harvested.links,
    title: harvested.title,
    canonical: harvested.canonical,
  });

  if (status >= 400 && path !== "/this-page-does-not-exist") {
    report("page returned an error", path, `status ${status}`);
  }

  // Assets must actually be fetchable.
  for (const asset of harvested.assets) {
    if (!asset.resolved) {
      report("unresolvable reference", path, `${asset.kind} ${asset.raw}`);
      continue;
    }
    if (asset.resolved.startsWith("data:") || asset.resolved.startsWith("blob:")) continue;
    if (!asset.resolved.startsWith(origin)) {
      external.set(asset.resolved, (external.get(asset.resolved) ?? new Set()).add(path));
      continue;
    }

    const assetResponse = await context.request.get(asset.resolved).catch(() => null);
    if (!assetResponse || assetResponse.status() >= 400) {
      report("broken asset", path, `${asset.kind} ${asset.raw} -> ${assetResponse?.status() ?? "no response"}`);
    }
  }

  // Queue internal pages, collect outbound ones.
  for (const link of harvested.links) {
    const href = link.href ?? "";

    if (href.startsWith("mailto:")) {
      const address = href.slice(7).split("?")[0];
      if (!/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(address)) {
        report("malformed mailto", path, href);
      }
      continue;
    }
    if (href.startsWith("tel:")) continue;
    if (!link.resolved) {
      report("unresolvable link", path, href);
      continue;
    }
    if (href.trim() === "" || href === "#") {
      report("empty link target", path, `"${link.text}"`);
      continue;
    }

    if (!link.resolved.startsWith(origin)) {
      external.set(link.resolved, (external.get(link.resolved) ?? new Set()).add(path));

      if (link.target === "_blank" && !(link.rel ?? "").includes("noopener")) {
        report("new-tab link without noopener", path, link.resolved);
      }
      continue;
    }

    const target = new URL(link.resolved);
    const nextPath = target.pathname + target.search;

    if (SKIP_PREFIXES.some((prefix) => target.pathname.startsWith(prefix))) continue;
    if (seen.has(nextPath)) continue;
    seen.add(nextPath);
    queue.push(nextPath);
  }

  process.stdout.write(`  ${String(status).padEnd(4)} ${path}\n`);
}

/* -------------------------------------------------------------------------- */
console.log("\nchecking in-page anchors");
{
  let checked = 0;
  for (const [path, info] of pages) {
    for (const link of info.links) {
      if (!link.resolved || !link.resolved.startsWith(origin)) continue;
      const target = new URL(link.resolved);
      if (!target.hash || target.hash === "#") continue;

      const targetPath = target.pathname + target.search;
      const targetPage = pages.get(targetPath);
      const id = decodeURIComponent(target.hash.slice(1));
      checked++;

      if (!targetPage) {
        report("anchor points at an uncrawled page", path, link.resolved);
      } else if (!targetPage.ids.has(id)) {
        report("anchor has no matching id", path, `${targetPath}#${id}`);
      }
    }
  }
  console.log(`  ${checked} anchor link(s) checked`);
}

/* -------------------------------------------------------------------------- */
console.log("\nchecking sitemap and feed");
{
  const sitemap = await context.request.get(`${origin}/sitemap.xml`);
  const sitemapBody = await sitemap.text();
  const urls = [...sitemapBody.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  console.log(`  sitemap lists ${urls.length} url(s)`);

  for (const listed of urls) {
    let listedPath;
    try {
      listedPath = new URL(listed).pathname;
    } catch {
      report("sitemap url is malformed", "/sitemap.xml", listed);
      continue;
    }

    const response = await context.request.get(`${origin}${listedPath}`).catch(() => null);
    if (!response || response.status() >= 400) {
      report("sitemap points at a dead page", "/sitemap.xml", `${listedPath} -> ${response?.status() ?? "no response"}`);
    }
    if (!pages.has(listedPath)) {
      report("published but nothing links to it", "/sitemap.xml", listedPath);
    }
  }

  const feed = await context.request.get(`${origin}/feed.xml`);
  const feedBody = await feed.text();
  const feedLinks = [...feedBody.matchAll(/<link>([^<]+)<\/link>/g)].map((m) => m[1]);
  console.log(`  feed lists ${feedLinks.length} link(s)`);

  for (const listed of feedLinks) {
    let listedPath;
    try {
      listedPath = new URL(listed).pathname;
    } catch {
      report("feed link is malformed", "/feed.xml", listed);
      continue;
    }
    const response = await context.request.get(`${origin}${listedPath}`).catch(() => null);
    if (!response || response.status() >= 400) {
      report("feed points at a dead page", "/feed.xml", `${listedPath} -> ${response?.status() ?? "no response"}`);
    }
  }
}

/* -------------------------------------------------------------------------- */
console.log("\nchecking outbound links");
{
  for (const [url, sources] of external) {
    let response = await context.request
      .head(url, { timeout: 20_000, maxRedirects: 5 })
      .catch(() => null);

    // Plenty of hosts refuse HEAD but answer GET.
    if (!response || response.status() >= 400) {
      response = await context.request.get(url, { timeout: 20_000, maxRedirects: 5 }).catch(() => null);
    }

    const status = response?.status() ?? 0;
    const label = `${status || "no response"}  ${url}`;

    if (!response) {
      report("outbound link unreachable", [...sources].join(", "), url);
    } else if (status >= 400) {
      // 403/405 from bot protection is common and not proof of a dead link.
      const kind = status === 403 || status === 405 || status === 429
        ? "outbound link refused our request (may still work in a browser)"
        : "outbound link is broken";
      report(kind, [...sources].join(", "), `${status} ${url}`);
    }
    console.log(`  ${label}`);
  }
}

/* -------------------------------------------------------------------------- */
console.log("\nchecking the not-found page");
{
  const response = await context.request.get(`${origin}/this-page-does-not-exist`);
  if (response.status() !== 404) {
    report("missing pages do not return 404", "/this-page-does-not-exist", `status ${response.status()}`);
  } else {
    console.log("  404 returned correctly");
  }
}

/* -------------------------------------------------------------------------- */
console.log("\nchecking titles and canonicals");
{
  const titles = new Map();
  for (const [path, info] of pages) {
    if (!info.title) report("page has no title", path, "");

    // A filtered view is allowed to share its parent's title as long as it
    // points the canonical at that parent, which is what tells a search engine
    // the two are one page.
    const selfCanonical =
      !info.canonical || new URL(info.canonical).pathname + new URL(info.canonical).search === path;

    if (info.title && selfCanonical) {
      titles.set(info.title, [...(titles.get(info.title) ?? []), path]);
    }
    if (!info.canonical) {
      report("page has no canonical link", path, "");
    } else if (!info.canonical.startsWith(origin)) {
      report("canonical points off-site", path, info.canonical);
    }
  }
  for (const [title, paths] of titles) {
    if (paths.length > 1) report("two pages share one title", paths.join(", "), title);
  }
}

await browser.close();

/* -------------------------------------------------------------------------- */
console.log(`\ncrawled ${pages.size} page(s), ${external.size} outbound link(s)`);

if (problems.length === 0) {
  console.log("\nno broken or dead links found");
  process.exit(0);
}

console.log(`\n${problems.length} problem(s):\n`);
const grouped = new Map();
for (const problem of problems) {
  grouped.set(problem.kind, [...(grouped.get(problem.kind) ?? []), problem]);
}
for (const [kind, items] of grouped) {
  console.log(`${kind}  (${items.length})`);
  for (const item of items) {
    console.log(`   on ${item.where}${item.detail ? `  ${item.detail}` : ""}`);
  }
  console.log();
}

const soft = ["outbound link refused our request (may still work in a browser)"];
const hard = problems.filter((problem) => !soft.includes(problem.kind));
process.exit(hard.length > 0 ? 1 : 0);

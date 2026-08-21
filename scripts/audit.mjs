/**
 * Lighthouse runner.
 *
 * Runs each page N times per form factor and reports the MEDIAN run, because a
 * single headless run on a developer machine is noisy enough to move a score by
 * several points. Reports are written to lighthouse-reports/.
 *
 * Usage:  node scripts/audit.mjs [baseUrl] [runs]
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const baseUrl = process.argv[2] ?? "http://localhost:3000";
const runs = Number(process.argv[3] ?? 3);
const outDir = path.join(process.cwd(), "lighthouse-reports");

// Resolve the CLI directly so this works the same on Windows and POSIX.
const lighthouseCli = createRequire(import.meta.url).resolve("lighthouse/cli/index.js");

const PAGES = [
  { name: "home", url: "/" },
  { name: "proposition", url: "/proposition" },
  { name: "contact", url: "/contact" },
  { name: "privacy", url: "/privacy" },
  { name: "blog", url: "/blog" },
  { name: "article", url: "/blog/why-ai-pilots-stall-before-production" },
];

const FORM_FACTORS = [
  { name: "mobile", args: [] },
  { name: "desktop", args: ["--preset=desktop"] },
];

fs.mkdirSync(outDir, { recursive: true });

const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"];

function runOnce(url, extraArgs, outFile) {
  fs.rmSync(outFile, { force: true });

  try {
    execFileSync(
      process.execPath,
      [
        lighthouseCli,
        url,
        "--quiet",
        "--chrome-flags=--headless=new --no-sandbox --disable-gpu",
        "--output=json",
        `--output-path=${outFile}`,
        ...extraArgs,
      ],
      { stdio: ["ignore", "ignore", "ignore"] },
    );
  } catch (error) {
    // chrome-launcher can fail to remove its temp profile on Windows (EPERM)
    // *after* the report has been written. Only rethrow if we got no report.
    if (!fs.existsSync(outFile)) throw error;
  }

  return JSON.parse(fs.readFileSync(outFile, "utf8"));
}

const summary = [];

for (const formFactor of FORM_FACTORS) {
  for (const page of PAGES) {
    const results = [];

    for (let run = 0; run < runs; run += 1) {
      const outFile = path.join(
        outDir,
        `${page.name}-${formFactor.name}${run === 0 ? "" : `-run${run}`}.json`,
      );
      results.push({ report: runOnce(baseUrl + page.url, formFactor.args, outFile), outFile });
    }

    // Median by performance score — the metric with the most run-to-run spread.
    results.sort(
      (a, b) =>
        a.report.categories.performance.score - b.report.categories.performance.score,
    );
    const median = results[Math.floor(results.length / 2)];

    // Keep the median run under the canonical filename.
    const canonical = path.join(outDir, `${page.name}-${formFactor.name}.json`);
    fs.writeFileSync(canonical, JSON.stringify(median.report));
    for (const { outFile } of results) {
      if (outFile !== canonical) fs.rmSync(outFile, { force: true });
    }

    const scores = Object.fromEntries(
      CATEGORIES.map((key) => [key, Math.round(median.report.categories[key].score * 100)]),
    );
    const audits = median.report.audits;

    summary.push({
      page: page.name,
      formFactor: formFactor.name,
      ...scores,
      LCP: audits["largest-contentful-paint"].displayValue,
      CLS: audits["cumulative-layout-shift"].displayValue,
      TBT: audits["total-blocking-time"].displayValue,
    });

    console.log(
      `${page.name.padEnd(8)} ${formFactor.name.padEnd(8)}`,
      CATEGORIES.map((key) => `${key[0].toUpperCase()}:${scores[key]}`).join(" "),
      `| LCP ${audits["largest-contentful-paint"].displayValue}`,
      `| CLS ${audits["cumulative-layout-shift"].displayValue}`,
      `| TBT ${audits["total-blocking-time"].displayValue}`,
    );
  }
}

fs.writeFileSync(
  path.join(outDir, "summary.json"),
  JSON.stringify({ baseUrl, runs, generatedAt: new Date().toISOString(), summary }, null, 2),
);

console.log(`\nMedian of ${runs} runs per page. Reports in lighthouse-reports/.`);

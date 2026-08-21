/**
 * Generates src/components/ui/Icon.tsx from official icon sources.
 *
 * Paths are fetched once and inlined rather than loading an icon webfont:
 * inlining costs no extra request, never flashes ligature text while a font
 * arrives, and every glyph is a transparent shape that inherits colour and size
 * from the text beside it.
 *
 * Sources:
 *   Google Material Symbols (Outlined), Apache 2.0 — the interface icons
 *   Simple Icons, CC0 — the brand marks, which Material Symbols does not carry
 *
 * Usage:  node scripts/build-icons.mjs
 */
import fs from "node:fs";
import path from "node:path";

const MATERIAL =
  "https://raw.githubusercontent.com/google/material-design-icons/master/symbols/web";
const BRAND = "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons";

/** our name -> Material Symbol name */
const ICONS = {
  mail: "mail",
  chat: "forum",
  "arrow-right": "arrow_forward",
  "arrow-left": "arrow_back",
  "arrow-down": "arrow_downward",
  "chevron-right": "chevron_right",
  "chevron-left": "chevron_left",
  "chevron-down": "expand_more",
  "check-circle": "check_circle",
  error: "error",
  close: "close",
  search: "search",
  clock: "schedule",
  calendar: "calendar_today",
  tag: "sell",
  external: "open_in_new",
  // "insights" itself only exists on Material's legacy 24 grid, which sits
  // optically lighter than the rest of the set. query_stats is the same chart
  // idea drawn on the current grid.
  insights: "query_stats",
  route: "route",
  shield: "verified_user",
  speed: "bolt",
  growth: "trending_up",
  people: "groups",
  cost: "savings",
  bank: "account_balance",
  truck: "local_shipping",
  server: "dns",
  terminal: "terminal",
  cart: "shopping_bag",
};

/** A generic speech bubble does not read as WhatsApp, so use the real marks. */
const BRANDS = {
  whatsapp: "whatsapp",
  linkedin: "linkedin",
};

async function fetchSvg(url, attempt = 1) {
  const response = await fetch(url);

  if (!response.ok) {
    if (attempt < 4) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 600));
      return fetchSvg(url, attempt + 1);
    }
    throw new Error(`HTTP ${response.status} after ${attempt} attempts`);
  }

  const svg = await response.text();
  const paths = [...svg.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1]);
  if (paths.length === 0) throw new Error("no path found");

  // Older symbols declare only width/height and lean on the implicit box.
  const width = svg.match(/\swidth="(\d+)"/)?.[1];
  const height = svg.match(/\sheight="(\d+)"/)?.[1];
  const viewBox =
    svg.match(/viewBox="([^"]+)"/)?.[1] ??
    (width && height ? `0 0 ${width} ${height}` : undefined);
  if (!viewBox) throw new Error("no viewBox and no width/height");

  return { paths, viewBox };
}

const entries = [];

for (const [name, symbol] of Object.entries(ICONS)) {
  try {
    const glyph = await fetchSvg(
      `${MATERIAL}/${symbol}/materialsymbolsoutlined/${symbol}_24px.svg`,
    );
    entries.push({ name, ...glyph });
    process.stdout.write(`  ${name.padEnd(15)} material/${symbol}\n`);
  } catch (error) {
    console.error(`  FAILED ${name}: ${error.message}`);
  }
}

for (const [name, slug] of Object.entries(BRANDS)) {
  try {
    const glyph = await fetchSvg(`${BRAND}/${slug}.svg`);
    entries.push({ name, ...glyph });
    process.stdout.write(`  ${name.padEnd(15)} brand/${slug}\n`);
  } catch (error) {
    console.error(`  FAILED ${name}: ${error.message}`);
  }
}

const expected = Object.keys(ICONS).length + Object.keys(BRANDS).length;
if (entries.length !== expected) {
  console.error(`
Only ${entries.length} of ${expected} icons fetched. Not writing a partial set.`);
  process.exit(1);
}

entries.sort((a, b) => a.name.localeCompare(b.name));

const file = `import { cx } from "@/lib/utils";

/**
 * The icon set. One place, one component, no hand-drawn one-offs.
 *
 * Google Material Symbols (Outlined) for interface icons, plus the official
 * brand marks for WhatsApp and LinkedIn. All inlined from source: no webfont, no
 * extra request, no flash of ligature text. Every glyph is a transparent shape
 * that takes \`currentColor\` and its size from the text beside it.
 *
 * Regenerate with \`node scripts/build-icons.mjs\`. Do not hand-edit the paths.
 *
 * Material Symbols: Apache 2.0. Simple Icons: CC0.
 */

const SIZES = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

export type IconName =
${entries.map((e) => `  | ${JSON.stringify(e.name)}`).join("\n")};

/**
 * Material Symbols draw on a 960 grid with a flipped origin; the brand marks use
 * a 24 grid. Each glyph carries its own box so the two sets render identically.
 */
const GLYPHS: Record<IconName, { viewBox: string; paths: string[] }> = {
${entries
  .map(
    (e) =>
      `  ${JSON.stringify(e.name)}: {\n    viewBox: ${JSON.stringify(e.viewBox)},\n    paths: [\n${e.paths
        .map((d) => `      ${JSON.stringify(d)},`)
        .join("\n")}\n    ],\n  },`,
  )
  .join("\n")}
};

export function Icon({
  name,
  size = "md",
  className,
}: {
  name: IconName;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const px = SIZES[size];
  const glyph = GLYPHS[name];

  return (
    <svg
      viewBox={glyph.viewBox}
      width={px}
      height={px}
      aria-hidden="true"
      focusable="false"
      className={cx("shrink-0", className)}
      fill="currentColor"
    >
      {glyph.paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
`;

fs.writeFileSync(path.join(process.cwd(), "src/components/ui/Icon.tsx"), file);
console.log(`\n${entries.length} icons written to src/components/ui/Icon.tsx`);

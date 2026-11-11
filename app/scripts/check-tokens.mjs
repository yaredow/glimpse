import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");

const palette = JSON.parse(
  fs.readFileSync(path.join(root, "lib/theme/palette.json"), "utf8"),
);
const css = fs.readFileSync(path.join(root, "global.css"), "utf8");

/** CSS custom property -> palette key. */
const VAR_TO_TOKEN = {
  "--background": "appBackground",
  "--foreground": "foreground",
  "--card": "surfaceCard",
  "--card-foreground": "foreground",
  "--popover": "surfaceCard",
  "--popover-foreground": "foreground",
  "--primary": "cinemaRed",
  "--primary-foreground": "white",
  "--muted": "mutedSurface",
  "--muted-foreground": "mutedForeground",
  "--accent": "mutedSurface",
  "--accent-foreground": "foreground",
  "--destructive": "error",
  "--destructive-foreground": "foreground",
  "--ring": "cinemaRed",
  "--surface-obsidian": "obsidian",
  "--surface-charcoal": "charcoal",
  "--surface-zinc-900": "zinc900",
  "--surface-zinc-850": "zinc850",
  "--surface-zinc-800": "zinc800",
  "--surface-zinc-750": "zinc750",
  "--surface-zinc-700": "zinc700",
  "--surface-brand": "surfaceBrand",
  "--surface-danger": "surfaceDanger",
  "--off-white": "offWhite",
  "--error-container": "errorContainer",
};

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** The same conversion React Native's colour parser performs. */
function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)].map((v) => Math.round(v * 255));
}

const rgbToHex = ([r, g, b]) =>
  "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();

let failures = 0;

for (const [name, raw] of Object.entries(VAR_TO_TOKEN)) {
  const expected = palette[raw];
  if (!expected) {
    console.error(`FAIL  ${name} - no palette key "${raw}"`);
    failures++;
    continue;
  }

  const match = css.match(
    new RegExp(`${name}:\\s*([0-9.]+)\\s+([0-9.]+)%\\s+([0-9.]+)%;`),
  );
  if (!match) {
    console.error(`FAIL  ${name} - not declared in global.css`);
    failures++;
    continue;
  }

  const got = rgbToHex(
    hslToRgb(Number(match[1]), Number(match[2]), Number(match[3])),
  );
  if (got !== expected.toUpperCase()) {
    console.error(
      `FAIL  ${name} - global.css says ${got}, palette says ${expected.toUpperCase()}`,
    );
    failures++;
  }
}

// The Tailwind config must expose every app token the two features need.
const config = fs.readFileSync(path.join(root, "tailwind.config.js"), "utf8");
const REQUIRED_UTILITIES = [
  "surface-obsidian",
  "surface-charcoal",
  "surface-zinc-900",
  "surface-zinc-850",
  "surface-zinc-800",
  "surface-zinc-750",
  "surface-zinc-700",
  "surface-brand",
  "surface-danger",
  "off-white",
  "error-container",
];
for (const utility of REQUIRED_UTILITIES) {
  if (!config.includes(`"${utility}"`) && !config.includes(`'${utility}'`)) {
    console.error(`FAIL  tailwind.config.js is missing the "${utility}" colour`);
    failures++;
  }
}

if (failures > 0) {
  console.error(`\n${failures} token mismatch(es).`);
  process.exit(1);
}

console.log(
  `Tokens agree: ${Object.keys(VAR_TO_TOKEN).length} CSS variables match palette.json, ` +
    `${REQUIRED_UTILITIES.length} Tailwind utilities present.`,
);

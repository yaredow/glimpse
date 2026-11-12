#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");

const ROOTS = ["app", "components", "features", "lib"];
const EXTENSIONS = /\.(ts|tsx|js|jsx|mjs)$/;

// Allowlisted hex literals outside lib/theme:
// - YouTube brand red: #FF0000
// - Pure black: #000, #000000
const ALLOWED_HEX = new Set(["#FF0000", "#ff0000", "#000", "#000000"]);

// Allowlisted rgba outside lib/theme:
// - Pure black transparent/overlay/shadow: rgba(0, 0, 0, ...)
// - White overlay: rgba(255, 255, 255, ...)
function isAllowedRgba(rgbaStr) {
  const match = rgbaStr.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!match) return false;
  const [, r, g, b] = match;
  const isBlack = r === "0" && g === "0" && b === "0";
  const isWhite = r === "255" && g === "255" && b === "255";
  return isBlack || isWhite;
}

const FORBIDDEN_PATTERNS = [
  {
    pattern: /@expo\/vector-icons|MaterialCommunityIcons/,
    message: "uses legacy icon library instead of phosphor-react-native",
  },
  {
    pattern: /\bLayoutAnimation\b|\bUIManager\b/,
    message: "uses LayoutAnimation/UIManager instead of Reanimated layout transitions",
  },
  {
    pattern: /\brounded-\[[^\]]+\]/,
    message: "uses arbitrary rounded-[...] instead of Tailwind standard radius tokens",
  },
  {
    pattern: /\btext-error-container\b(?!-foreground)/,
    message: "uses text-error-container instead of text-error-container-foreground",
  },
];

function* lines(file) {
  const source = fs.readFileSync(file, "utf8");
  const rows = source.split("\n");
  for (let index = 0; index < rows.length; index++) {
    yield { line: rows[index], number: index + 1 };
  }
}

function* walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (EXTENSIONS.test(entry.name)) yield full;
  }
}

const failures = [];

for (const dir of ROOTS) {
  const absolute = path.join(root, dir);
  if (!fs.existsSync(absolute)) continue;

  for (const file of walk(absolute)) {
    const relativePath = path.relative(root, file);
    const isThemeFile = relativePath.startsWith("lib/theme/");
    const isTestOrGen =
      relativePath.includes(".test.") || relativePath.includes(".generated.");

    for (const { line, number } of lines(file)) {
      // 1. General forbidden patterns across all files
      for (const { pattern, message } of FORBIDDEN_PATTERNS) {
        if (pattern.test(line)) {
          failures.push(
            `${relativePath}:${number} ${message}\n    ${line.trim()}`,
          );
        }
      }

      // 2. Color checks outside lib/theme and generated/test files
      if (!isThemeFile && !isTestOrGen) {
        // Strip URLs, comments, and strings that aren't colors
        const trimmed = line.trim();
        if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;

        // Check for raw hex colors
        const hexMatches = line.matchAll(/#([0-9a-fA-F]{3,8})\b/g);
        for (const match of hexMatches) {
          const hex = match[0];
          if (!ALLOWED_HEX.has(hex)) {
            failures.push(
              `${relativePath}:${number} raw hex color "${hex}" outside lib/theme (not in allowlist)\n    ${trimmed}`,
            );
          }
        }

        // Check for raw rgba/rgb colors
        const rgbaMatches = line.matchAll(/rgba?\([^)]+\)/gi);
        for (const match of rgbaMatches) {
          const rgba = match[0];
          if (!isAllowedRgba(rgba)) {
            failures.push(
              `${relativePath}:${number} raw rgb/rgba color "${rgba}" outside lib/theme (not in allowlist)\n    ${trimmed}`,
            );
          }
        }
      }
    }
  }
}

if (failures.length > 0) {
  console.error("Visual adaptation violations found:\n");
  for (const failure of failures) console.error("  " + failure + "\n");
  process.exit(1);
}

console.log(
  "Visual adaptation checks passed (no vector-icons, no rogue hex/rgba, no LayoutAnimation, no arbitrary rounded).",
);

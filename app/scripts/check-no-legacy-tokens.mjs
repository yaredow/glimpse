#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");

// Directories that ship application code. `scripts/` is skipped because this
// file necessarily contains the forbidden strings.
const ROOTS = ["app", "components", "features", "lib", "hooks", "constants"];
const EXTENSIONS = /\.(ts|tsx|js|jsx|mjs)$/;

const FORBIDDEN = [
  { pattern: /lib\/theme\/colors\b/, message: "imports the deleted lib/theme/colors" },
  { pattern: /\bpalette\.json\b/, message: "references the deleted palette.json" },
  { pattern: /\buseAppTheme\b/, message: "uses the deleted useAppTheme hook" },
  { pattern: /\bthemeColors\b/, message: "uses the deleted themeColors object" },
  { pattern: /\bAppThemeContext\b/, message: "uses the deleted AppThemeContext" },
  { pattern: /\bglimpseDarkTheme\b/, message: "uses the deleted glimpseDarkTheme" },
  { pattern: /\bnetflixTheme\b/, message: "uses the deleted netflixTheme" },
  { pattern: /\bcheck-tokens\.mjs\b/, message: "references the deleted check-tokens script" },
];

/** Collect every line of a file with its 1-based line number. */
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
    for (const { line, number } of lines(file)) {
      for (const { pattern, message } of FORBIDDEN) {
        if (pattern.test(line)) {
          failures.push(
            `${path.relative(root, file)}:${number} ${message}\n    ${line.trim()}`,
          );
        }
      }
    }
  }
}

if (failures.length > 0) {
  console.error("Legacy token layer is referenced:\n");
  for (const failure of failures) console.error("  " + failure + "\n");
  console.error("Use colors from lib/theme/tokens.generated.ts instead.");
  process.exit(1);
}

console.log("No references to the legacy token layer.");

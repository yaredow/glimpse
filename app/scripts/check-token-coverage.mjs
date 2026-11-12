#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import postcss from "postcss";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const require = createRequire(import.meta.url);

/** Colour variables defined in `:root` (everything except --radius). */
function readCssVariables() {
  const css = fs.readFileSync(path.join(root, "global.css"), "utf8");
  const variables = new Set();

  postcss.parse(css).walkRules((rule) => {
    if (rule.selector.trim() !== ":root") return;
    rule.walkDecls((decl) => {
      if (!decl.prop.startsWith("--")) return;
      if (decl.prop === "--radius") return;
      variables.add(decl.prop);
    });
  });

  return variables;
}

/** Every `var(--token)` referenced by the Tailwind colour scale. */
function readTailwindVariables() {
  const config = require(path.join(root, "tailwind.config.js"));
  const variables = new Set();

  const collect = (value) => {
    if (typeof value === "string") {
      const match = value.match(/var\((--[a-z0-9-]+)\)/);
      if (match) variables.add(match[1]);
      return;
    }
    if (value && typeof value === "object") {
      for (const child of Object.values(value)) collect(child);
    }
  };

  collect(config.theme?.extend?.colors);
  return variables;
}

const cssVariables = readCssVariables();
const tailwindVariables = readTailwindVariables();

const missingInTailwind = [...cssVariables].filter(
  (variable) => !tailwindVariables.has(variable),
);
const danglingInTailwind = [...tailwindVariables].filter(
  (variable) => !cssVariables.has(variable),
);

if (missingInTailwind.length > 0 || danglingInTailwind.length > 0) {
  if (missingInTailwind.length > 0) {
    console.error("global.css variables missing a Tailwind colour utility:\n");
    for (const variable of missingInTailwind) console.error(`  ${variable}`);
  }
  if (danglingInTailwind.length > 0) {
    console.error("Tailwind colours referencing a missing global.css variable:\n");
    for (const variable of danglingInTailwind) console.error(`  ${variable}`);
  }
  process.exit(1);
}

console.log(
  `Token coverage is complete (${cssVariables.size} variables ↔ ${tailwindVariables.size} Tailwind references).`,
);

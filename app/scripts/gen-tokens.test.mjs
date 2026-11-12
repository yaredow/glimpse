import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  cssVarToKey,
  generate,
  hslTripletToHex,
  parseColorTokens,
  renderTokensModule,
} from "./gen-tokens.mjs";

test("hslTripletToHex matches the token contract", () => {
  assert.equal(hslTripletToHex("0 0% 100%"), "#FFFFFF");
  assert.equal(hslTripletToHex("240 7.7% 5.1%"), "#0C0C0E");
  assert.equal(hslTripletToHex("357 92.4% 46.7%"), "#E50914");
  assert.equal(hslTripletToHex("240 5% 15%"), "#242428");
  assert.equal(hslTripletToHex("352.5 33.3% 9.4%"), "#201012");
});

test("hslTripletToHex rejects non-colour values", () => {
  assert.equal(hslTripletToHex("0.75rem"), null);
  assert.equal(hslTripletToHex("#0C0C0E"), null);
});

test("cssVarToKey produces the documented JS names", () => {
  assert.equal(cssVarToKey("--surface-1"), "surface1");
  assert.equal(cssVarToKey("--primary-hover"), "primaryHover");
  assert.equal(cssVarToKey("--error-container-foreground"), "errorContainerForeground");
  assert.equal(cssVarToKey("--off-white"), "offWhite");
});

test("parseColorTokens reads :root, skips --radius and duplicate keys", () => {
  const tokens = parseColorTokens(`
    :root {
      --primary: 357 92.4% 46.7%;
      --surface-1: 0 0% 7.1%;
      --radius: 0.75rem;
    }
  `);

  assert.deepEqual(
    tokens.map(({ key, hex }) => [key, hex]),
    [
      ["primary", "#E50914"],
      ["surface1", "#121212"],
    ],
  );

  assert.throws(
    () => parseColorTokens(":root { --a-b: 0 0% 100%; --a--b: 0 0% 0%; }"),
    /Duplicate token key/,
  );
});

test("renderTokensModule emits a typed, generated header", () => {
  const output = renderTokensModule([
    { key: "primary", hex: "#E50914" },
    { key: "surface1", hex: "#121212" },
  ]);

  assert.match(output, /AUTO-GENERATED/);
  assert.match(output, /export const colors = \{/);
  assert.match(output, /primary: "#E50914",/);
  assert.match(output, /surface1: "#121212",/);
  assert.match(output, /export type ColorToken = keyof typeof colors;/);
});

test("generate writes the file and --check detects drift", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "glimpse-tokens-"));
  const cssPath = path.join(dir, "global.css");
  const outPath = path.join(dir, "tokens.generated.ts");

  try {
    fs.writeFileSync(cssPath, ":root { --primary: 357 92.4% 46.7%; --radius: 0.75rem; }");

    const first = generate({ cssPath, outPath });
    assert.equal(first.ok, true);
    assert.match(fs.readFileSync(outPath, "utf8"), /primary: "#E50914"/);
    assert.equal(generate({ cssPath, outPath, check: true }).ok, true);

    fs.writeFileSync(cssPath, ":root { --primary: 0 0% 100%; --radius: 0.75rem; }");
    assert.equal(generate({ cssPath, outPath, check: true }).ok, false);

    fs.rmSync(outPath);
    assert.equal(generate({ cssPath, outPath, check: true }).ok, false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

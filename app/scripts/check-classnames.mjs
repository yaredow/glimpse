import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");

const NOT_INTEROPPED_PACKAGES = [
  "expo-image",
  "expo-linear-gradient",
  "expo-blur",
  "react-native-svg",
  "phosphor-react-native",
  "@expo/vector-icons",
];

const roots = ["app", "components", "features"];
const files = [];
for (const dir of roots) {
  const walk = (d) => {
    for (const entry of fs.readdirSync(path.join(root, d), { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".tsx")) files.push(path.join(root, full));
    }
  };
  walk(dir);
}

const failures = [];

for (const file of files) {
  const source = fs.readFileSync(file, "utf8");

  // Local names imported from a package NativeWind does not interop.
  const unsafeNames = new Set();
  for (const m of source.matchAll(
    /import\s*\{([^}]*)\}\s*from\s*"([^"]+)"/g,
  )) {
    if (!NOT_INTEROPPED_PACKAGES.includes(m[2])) continue;
    for (const name of m[1].split(",")) {
      const local = name.trim().split(/\s+as\s+/).pop();
      if (local) unsafeNames.add(local.trim());
    }
  }

  // Animated.* is never interopped, whatever it wraps.
  const animatedTag = /<Animated\.([A-Za-z]+)\b([^>]*)>/g;
  for (const m of source.matchAll(animatedTag)) {
    if (/\bclassName\s*=/.test(m[2])) {
      failures.push(
        `${path.relative(root, file)}: <Animated.${m[1]}> uses className - animated components ignore it`,
      );
    }
  }

  // Any component imported from a non-interopped package.
  for (const name of unsafeNames) {
    if (!name) continue;
    const re = new RegExp(`<${name}\\b([^>]*)>`, "g");
    for (const m of source.matchAll(re)) {
      if (/\bclassName\s*=/.test(m[1])) {
        failures.push(
          `${path.relative(root, file)}: <${name}> uses className - it is not NativeWind-interopped, so the class is dropped`,
        );
      }
    }
  }
}

if (failures.length > 0) {
  console.error("className used on components NativeWind does not interop:\n");
  for (const f of failures) console.error("  " + f);
  console.error(
    "\nUse a plain style object for these, or register the component with cssInterop.",
  );
  process.exit(1);
}

console.log(
  `className usage is safe across ${files.length} files (checked Animated.* and ${NOT_INTEROPPED_PACKAGES.length} non-interopped packages).`,
);

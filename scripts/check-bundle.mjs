// Build guard: fails the production build if any bundled output references
// localhost / 127.0.0.1. This class of bug (a VITE_* var or stray constant
// baking a dev URL into the shipped JS) previously broke production logins:
// every visitor's browser tried to call its own localhost instead of the API.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const DIST = new URL("../client/dist", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

// Patterns that indicate a real leak (dev API/server URLs).
// A bare "http://localhost" literal next to window.location.href can occur
// inside dependency internals (e.g. axios env detection) and is harmless,
// so only URLs with a port — or explicit API paths — are flagged.
const LEAK_PATTERNS = [
  /https?:\/\/(localhost|127\.0\.0\.1):\d+/, // any localhost URL with a port
  /baseURL\s*[:=]\s*[\"']https?:\/\/(localhost|127\.0\.0\.1)/, // API base on localhost
  /[\"']https?:\/\/(localhost|127\.0\.0\.1)\/api[\"']/, // literal localhost API URL
];

const files = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.(js|css|html)$/.test(entry)) files.push(full);
  }
};

try {
  walk(DIST);
} catch {
  console.error(`✗ check-bundle: dist folder not found at ${DIST}`);
  process.exit(1);
}

const offenders = [];
for (const f of files) {
  const src = readFileSync(f, "utf8");
  for (const rx of LEAK_PATTERNS) {
    if (rx.test(src)) offenders.push(f);
  }
}

if (offenders.length) {
  console.error("\n✗ BUILD FAILED: localhost/127.0.0.1 references found in bundled output:");
  for (const f of [...new Set(offenders)]) console.error(`  - ${f}`);
  console.error("\nThis usually means a VITE_* env var or constant baked a dev URL into the bundle.");
  console.error("The client should always talk to same-origin \"/api\" in production.\n");
  process.exit(1);
}

console.log(`✓ bundle check passed: ${files.length} files, no localhost references`);

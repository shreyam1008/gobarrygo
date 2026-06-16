import { gzipSync } from "node:zlib";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const assetsDir = fileURLToPath(new URL("../dist/assets/", import.meta.url));
const budgets = {
  jsRaw: 280 * 1024,
  jsGzip: 90 * 1024,
  cssRaw: 12 * 1024,
  cssGzip: 4 * 1024,
  totalGzip: 100 * 1024,
};

const totals = {
  jsRaw: 0,
  jsGzip: 0,
  cssRaw: 0,
  cssGzip: 0,
};

for (const file of readdirSync(assetsDir)) {
  if (!file.endsWith(".js") && !file.endsWith(".css")) {
    continue;
  }

  const contents = readFileSync(join(assetsDir, file));
  const gzipSize = gzipSync(contents).length;

  if (file.endsWith(".js")) {
    totals.jsRaw += contents.length;
    totals.jsGzip += gzipSize;
  } else {
    totals.cssRaw += contents.length;
    totals.cssGzip += gzipSize;
  }
}

const totalGzip = totals.jsGzip + totals.cssGzip;
const failures = [
  ["JS raw", totals.jsRaw, budgets.jsRaw],
  ["JS gzip", totals.jsGzip, budgets.jsGzip],
  ["CSS raw", totals.cssRaw, budgets.cssRaw],
  ["CSS gzip", totals.cssGzip, budgets.cssGzip],
  ["Total gzip", totalGzip, budgets.totalGzip],
].filter(([, actual, budget]) => actual > budget);

console.log(`JS ${formatBytes(totals.jsRaw)} raw / ${formatBytes(totals.jsGzip)} gzip`);
console.log(`CSS ${formatBytes(totals.cssRaw)} raw / ${formatBytes(totals.cssGzip)} gzip`);
console.log(`Total initial gzip ${formatBytes(totalGzip)}`);

if (failures.length > 0) {
  for (const [label, actual, budget] of failures) {
    console.error(`${label} budget exceeded: ${formatBytes(actual)} > ${formatBytes(budget)}`);
  }
  process.exit(1);
}

function formatBytes(value) {
  return `${(value / 1024).toFixed(1)} KB`;
}

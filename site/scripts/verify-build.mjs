import { readFile } from 'node:fs/promises';

const siteOrigin = process.env.PUBLIC_SITE_URL || 'https://gobarrygo.shreyam1008.com.np';
const basePath = process.env.PUBLIC_BASE_PATH || '/';
const normalizedBase = `${basePath.replace(/^\/*|\/*$/g, '')}/`;
const expectedRoot = new URL(normalizedBase, `${siteOrigin.replace(/\/$/, '')}/`).toString();
const expectedAssetPath = `/${normalizedBase}favicon.svg`.replace(/\/{2,}/g, '/');

const [html, robots, sitemap] = await Promise.all([
  readFile(new URL('../dist/index.html', import.meta.url), 'utf8'),
  readFile(new URL('../dist/robots.txt', import.meta.url), 'utf8'),
  readFile(new URL('../dist/sitemap.xml', import.meta.url), 'utf8')
]);

const checks = [
  [html, `<link rel="canonical" href="${expectedRoot}">`, 'canonical link'],
  [html, `href="${expectedAssetPath}"`, 'base-aware favicon'],
  [html, '<title>GoBarryGo has moved to ProtoPeek Downloader</title>', 'retirement title'],
  [html, 'ProtoPeek v0.5 Downloader', 'ProtoPeek v0.5 transition message'],
  [html, 'https://protopeek.shreyam1008.com.np/downloader/', 'ProtoPeek Downloader link'],
  [html, 'docs/migrating-to-protopeek.md', 'GoBarryGo migration guide link'],
  [html, '/releases/tag/v0.0.9', 'legacy release link'],
  [html, '/releases/download/v0.0.9/checksums.txt', 'legacy checksum link'],
  [robots, `Sitemap: ${expectedRoot}sitemap.xml`, 'robots sitemap'],
  [sitemap, `<loc>${expectedRoot}</loc>`, 'sitemap URL']
];

for (const [content, expected, label] of checks) {
  if (!content.includes(expected)) throw new Error(`Missing ${label}: ${expected}`);
}

const legacyAssets = [
  'gobarrygo.deb',
  'gobarrygo.rpm',
  'gobarrygo-amd64.AppImage',
  'gobarrygo-linux-amd64',
  'gobarrygo-amd64-installer.exe',
  'gobarrygo.exe',
  'gobarrygo-macos.zip'
];

for (const asset of legacyAssets) {
  const expected = `/releases/download/v0.0.9/${asset}`;
  if (!html.includes(expected)) throw new Error(`Missing legacy release asset link: ${expected}`);
}

if (html.includes('{JSON.stringify')) {
  throw new Error('JSON-LD contains an unrendered JSON.stringify expression');
}

const jsonLdMatches = [
  ...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)
];

if (jsonLdMatches.length !== 1) {
  throw new Error(`Expected exactly one JSON-LD block, found ${jsonLdMatches.length}`);
}

let structuredData;
try {
  structuredData = JSON.parse(jsonLdMatches[0][1]);
} catch (error) {
  throw new Error(`JSON-LD is not valid JSON: ${error.message}`);
}

if (structuredData['@context'] !== 'https://schema.org' || !Array.isArray(structuredData['@graph'])) {
  throw new Error('JSON-LD must contain a schema.org @graph');
}

const legacySoftware = structuredData['@graph'].find(
  (entry) => entry['@type'] === 'SoftwareApplication' && entry.name === 'GoBarryGo'
);

if (!legacySoftware) throw new Error('JSON-LD is missing the GoBarryGo SoftwareApplication');
if (legacySoftware.softwareVersion !== '0.0.9') throw new Error('JSON-LD legacy version must be 0.0.9');
if (legacySoftware.isPartOf?.name !== 'ProtoPeek' || legacySoftware.isPartOf?.softwareVersion !== '0.5.0') {
  throw new Error('JSON-LD must identify ProtoPeek v0.5.0 as the continued product');
}

if (/<meta[^>]+http-equiv=["']refresh["']/i.test(html) || /window\.location\s*=/.test(html)) {
  throw new Error('Compatibility page must not activate a client-side redirect');
}

console.log(`Verified retirement Pages output for ${expectedRoot}`);

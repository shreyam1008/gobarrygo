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
  [robots, `Sitemap: ${expectedRoot}sitemap.xml`, 'robots sitemap'],
  [sitemap, `<loc>${expectedRoot}</loc>`, 'sitemap URL']
];

for (const [content, expected, label] of checks) {
  if (!content.includes(expected)) throw new Error(`Missing ${label}: ${expected}`);
}

console.log(`Verified Pages output for ${expectedRoot}`);

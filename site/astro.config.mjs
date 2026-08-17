import { defineConfig } from 'astro/config';

const basePath = process.env.PUBLIC_BASE_PATH || '/';
const siteUrl = process.env.PUBLIC_SITE_URL || 'https://gobarrygo.shreyam1008.com.np';

export default defineConfig({
  output: 'static',
  site: siteUrl,
  base: basePath,
  trailingSlash: 'always',
});

# Website hosting

Cloudflare Pages project `gobarrygo` publishes https://gobarrygo.shreyam1008.com.np/.
GitHub integration watches `main`, with root directory `site`, build command
`bun install --frozen-lockfile && bun run verify`, and output directory `dist`.
Set `BUN_VERSION=1.3.10`, `SKIP_DEPENDENCY_INSTALL=true`, `PUBLIC_BASE_PATH=/`, and
`PUBLIC_SITE_URL=https://gobarrygo.shreyam1008.com.np`. Watch changes under `site/`.

The build verifies the static website before deployment. Keep `public/404.html`
and the existing custom-domain canonical metadata. The app's GitHub releases
remain unchanged.

GitHub Pages hosting and its deployment workflow were disabled on 9 September 2026.

Rollback now requires re-enabling and successfully deploying GitHub Pages before
restoring its DNS target; changing DNS alone is not sufficient. Retiring GitHub
Pages also retires the old github.io-hosted URLs and redirects.

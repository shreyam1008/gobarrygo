# Changelog

## 0.0.9 CHITRA - 2026-06-16

- **Added:** Downloader metrics strip for current speed, peak speed, active ETA, backlog, queue state, connections, and issues.
- **Fixed:** Multi-link paste now queues independent aria2 downloads instead of treating separate links as mirrors for one item.
- **Improved:** aria2 session state is saved after queue mutations and during graceful shutdown.
- **Improved:** Backend polling is adaptive and skips unchanged snapshot events to reduce idle runtime work.
- **Improved:** Native minimum-width layout keeps the inspector available and keeps bundle budget checks in release jobs.
- **Updated:** Site and packaging metadata point to v0.0.9.

## 0.0.8 CHITRA - 2026-06-16

- **Redesigned:** Desktop app UI is now a compact native download-manager workspace instead of a webpage-style hero layout.
- **Added:** Quick paste queueing, remembered download locations, in-app About links, richer inspector actions, and clearer aria2 setup.
- **Improved:** Download list rendering now uses a virtualized queue and transform-based progress updates for better responsiveness.
- **Added:** Frontend bundle budget check in CI to keep the native app shell lightweight.
- **Updated:** Site and packaging metadata point to v0.0.8.

## 0.0.7 CHITRA - 2026-03-14

- **Fixed:** Bundled aria2c now correctly initializes its session file on first run, fixing the "rpc did not become ready" error for new users.
- **Fixed:** Standalone Linux binary (`gobarrygo-linux-amd64`) now has a proper window icon (embedded in the binary).
- **Improved:** Aria2c startup errors are now captured and displayed in the error message for easier debugging.
- **Updated:** Site download links point to v0.0.7.

## 0.0.6 CHITRA - 2026-03-13

- Fixed critical bug: frontend assets not embedded in production binary (Go build cache stale after `wails3 generate bindings`).
- Added `go clean -cache` before all `go build` steps in CI/release to prevent stale embeds.
- Added `frontend/dist/index.html` existence check as a build guard in all workflows.
- Added standalone Linux binary (`gobarrygo-linux-amd64`) to release artifacts for single-file usage.
- Updated site with direct download links for all platforms and CLI install instructions.
- Added SEO assets: `robots.txt`, `sitemap.xml`, JSON-LD structured data, comprehensive meta tags.
- Made site fully mobile-responsive with sticky nav and touch-friendly layout.
- Bundled aria2c inside release binaries — zero external dependencies, just download and run.

## 0.0.5 BHOODEVI - 2026-03-13

- Added standalone `install.sh` for one-command installation on Linux, macOS, and Windows (Git Bash).
- Added static documentation site at `shreyam1008.github.io/gobarrygo` with GitHub Pages deployment.
- Applied Wails CLI caching across all GitHub Actions workflows for faster builds.
- Fixed `go:embed` failures caused by missing `frontend/dist` directory on clean checkouts.
- Removed redundant `tsc --noEmit` from build scripts to eliminate duplicate type-checking.
- Fixed Windows release builds failing due to PowerShell not expanding bash-style environment variables.

## 0.0.1 AARATI - 2026-03-13

- Initial public version of GoBarryGo.
- Added a Wails v3 alpha desktop shell with Go backend and Bun/React frontend.
- Implemented a managed `aria2c` JSON-RPC controller with persistent preferences.
- Added download queue operations, health state, notifications, and file/folder actions.
- Added Linux, Windows, and macOS build and packaging tasks.
- Added GitHub Actions for CI, main-branch artifact builds, releases, and dependency audit checks.

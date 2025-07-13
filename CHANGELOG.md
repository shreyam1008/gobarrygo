# Changelog

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

# GoBarryGo

GoBarryGo is a lightweight desktop download manager for `aria2c`, built from scratch with Go, Wails v3 alpha, Bun, React 19, and TypeScript. Version `0.0.5` is codename `BHOODEVI`.

## What It Does

- Controls a managed `aria2c` background process through JSON-RPC.
- Exposes a desktop UI for queueing URLs, watching progress, and opening completed files.
- Persists preferences for download folder, parallelism, splitting, allocation strategy, and notifications.
- Ships cross-platform packaging for Linux, Windows, and macOS through GitHub Actions.
- Keeps the frontend bundle small and the app architecture thin by treating Wails as transport and packaging glue instead of the application core.

## Product Decisions

- `aria2c` is treated as an external runtime dependency instead of being bundled into the binary.
- Wails is pinned to `v3.0.0-alpha.74` because that is the newest Go alpha tag verifiable and buildable in this environment.
- The frontend uses Bun + React 19.2 + TypeScript 5.9 with generated Wails bindings.
- Release artifacts are published through GitHub Releases. Pushes to `main` produce build artifacts for inspection.

## Features In 0.0.5 BHOODEVI

- Add downloads by URL with optional output name, directory override, headers, and User-Agent override.
- Pause, resume, retry, remove, open file, and reveal folder actions.
- Global pause and resume controls.
- Health banner for `aria2c` readiness and binary discovery.
- Preferences for:
  - `aria2c` binary path
  - download directory
  - max concurrent downloads
  - split count
  - max connections per server
  - min split size
  - file allocation mode
  - continue and resume behavior
  - auto rename behavior
  - completion and failure notifications

## Requirements

- Go `1.26.0`
- Bun `1.3.10`
- `aria2c` installed and available on `PATH`, or manually configured in Preferences
- Wails CLI `v3.0.0-alpha.74`

Linux build prerequisites:

- `libgtk-3-dev`
- `libwebkit2gtk-4.1-dev`
- `libsoup-3.0-dev`
- `pkg-config`

## Quick Install

Download a pre-built binary on Linux, macOS, or Windows (Git Bash):

```bash
curl -fsSL https://raw.githubusercontent.com/shreyam1008/gobarrygo/main/install.sh | bash
```

No Go toolchain, Node.js, or complex dependencies required.

**Website**: [https://shreyam1008.github.io/gobarrygo/](https://shreyam1008.github.io/gobarrygo/)

## Development Setup

```bash
go install github.com/wailsapp/wails/v3/cmd/wails3@v3.0.0-alpha.74
cd frontend && bun install && cd ..
go run ./tools/generate_appicon.go
wails3 generate icons -input build/appicon.png -macfilename build/darwin/icons.icns -windowsfilename build/windows/icon.ico
wails3 generate bindings -clean=true -ts
wails3 dev -config ./build/config.yml -port 9245
```

## Build Commands

```bash
task test
task lint
task linux:build
task windows:build
task darwin:build
```

Packaging commands:

```bash
task linux:package
task windows:package
task darwin:package
```

## Latest Builds

Release builds are published automatically when a version tag is pushed:

1.  Go to the [Releases](https://github.com/shreyam1008/gobarrygo/releases) page.
2.  Download the package for your platform from the latest release.
3.  Every push to `main` runs validation via the **ci** workflow in [Actions](https://github.com/shreyam1008/gobarrygo/actions).

## Repository Guide

- `main.go`: desktop entry point and Wails application bootstrap.
- `internal/api`: Wails-facing service surface.
- `internal/app`: controller logic and state orchestration.
- `internal/aria2`: process management, RPC client, and download mapping.
- `internal/config`: persisted preferences.
- `frontend/src`: React UI and store.
- `build`: Wails metadata, packaging assets, and platform task definitions.
- `tests`: Go regression tests.
- `.github/workflows`: CI and release automation.

## Verification Status

Verified locally in this workspace:

- frontend typecheck
- frontend tests
- frontend production build
- Go tests for non-GUI packages

Not fully verified locally:

- native Linux Wails GUI build, because this machine does not currently have `libgtk-3-dev` and `libwebkit2gtk-4.1-dev` installed
- native macOS and Windows packaging, which are delegated to GitHub Actions runners

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Building](docs/BUILDING.md)
- [Releasing](docs/RELEASING.md)
- [Changelog](CHANGELOG.md)
- [Third Party Notices](THIRD_PARTY_NOTICES.md)


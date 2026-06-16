# Third Party Notices

GoBarryGo is distributed under the MIT license. This project depends on a number of third-party open source components.

## Direct Runtime Dependencies

- Wails v3 alpha
  - project: https://github.com/wailsapp/wails
  - license: MIT
- React
  - project: https://react.dev/
  - license: MIT
- React DOM
  - project: https://react.dev/
  - license: MIT
- Lucide React
  - project: https://github.com/lucide-icons/lucide
  - license: ISC
- Bun
  - project: https://bun.sh/
  - license: MIT
- Vite
  - project: https://vite.dev/
  - license: MIT
- TypeScript
  - project: https://www.typescriptlang.org/
  - license: Apache-2.0

## Download Engine

- aria2
  - project: https://github.com/aria2/aria2
  - license: GPL-2.0-or-later
  - note: GoBarryGo can use a user-selected `aria2c`, a system `PATH` installation, or a bundled release fallback. Release workflows fetch platform `aria2c` binaries from the upstream aria2/static-build sources referenced in `.github/workflows/release.yml`; source code for aria2 is available from the upstream project.

## Full Dependency Trees

- Frontend dependency versions are locked in `frontend/bun.lock`.
- Go dependency versions are locked in `go.mod` and `go.sum`.

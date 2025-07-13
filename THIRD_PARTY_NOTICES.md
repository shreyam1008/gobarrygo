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

## External Runtime Dependency

- aria2
  - project: https://github.com/aria2/aria2
  - license: GPL-2.0-or-later
  - note: GoBarryGo does not bundle `aria2c`. Users install it separately and point the application to the executable if it is not already present on `PATH`.

## Full Dependency Trees

- Frontend dependency versions are locked in `frontend/bun.lock`.
- Go dependency versions are locked in `go.mod` and `go.sum`.


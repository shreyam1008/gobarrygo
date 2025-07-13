# Architecture

GoBarryGo is organized around one rule: keep Wails thin and keep application logic portable.

## Layers

### Desktop Shell

- `main.go` creates the Wails application, registers typed events, mounts the frontend assets, and wires services into a single main window.
- `internal/api` exposes a narrow service surface to the frontend and owns event publication plus native dialog access.

### Application Core

- `internal/app/controller.go` orchestrates preferences, manager actions, snapshots, and metadata.
- The controller knows nothing about HTML, React, or Wails transport details.

### Download Engine

- `internal/aria2/client.go` implements the aria2 JSON-RPC client.
- `internal/aria2/manager.go` owns process startup, restart, health checks, snapshot collection, and command dispatch.
- `internal/aria2/mapper.go` transforms raw RPC payloads into frontend-facing download models.

### Persistence And Platform Support

- `internal/config` stores preferences as JSON.
- `internal/system` resolves paths and performs OS-native open/reveal actions.
- `internal/version` centralizes the release number and codename.

### Frontend

- `frontend/src/app` owns the shell and layout.
- `frontend/src/lib/store` contains the global application store.
- `frontend/src/lib/wails` isolates generated bindings and Wails event subscription details.
- `frontend/src/features/*` keeps view logic grouped by product surface instead of by generic component type.

## State Flow

1. The frontend calls `Bootstrap`.
2. The controller loads preferences and ensures `aria2c` is running.
3. The manager returns a typed snapshot containing health, metrics, preferences, and downloads.
4. The service publishes `app:snapshot`.
5. The frontend store reconciles the incoming snapshot and updates the UI.
6. Command methods return a fresh snapshot immediately, while background polling keeps the UI live.

## Why `aria2c` Is Not Bundled

- It keeps app binaries smaller.
- It avoids redistributing a GPL component inside the desktop package.
- It lets advanced users point the app at distro-managed or custom-built `aria2c` binaries.

## Wails v3 Alpha Risk Containment

- Wails-specific code is concentrated in `main.go`, `internal/api`, generated bindings, and platform packaging files.
- The download manager core is plain Go and can survive Wails API churn with minimal changes.
- The frontend talks to a compact service contract and two typed events instead of depending on framework internals.


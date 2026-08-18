# Architecture

GoBarryGo is organized around two rules: keep Wails thin and keep application logic
portable; grow the product as small native modules inside one consistent shell.

The shipped release is downloader-first. The module boundary below is the target
shape for the suite and does not imply that future file, batch, or workflow modules
already exist.

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

### Future module boundary

When a second module is introduced, keep the shell and module responsibilities
explicit:

- The shell owns navigation, settings, lifecycle, shared job state, notifications,
  and the selected-module context.
- A module owns its domain commands, validation, progress details, and recovery
  rules. The downloader is the first example of this boundary.
- Long-running work is represented as a typed, cancellable job with a visible state
  (`queued`, `running`, `paused`, `completed`, `failed`, or `cancelled`).
- Module code stays in plain Go or framework-independent TypeScript where possible;
  Wails bindings remain an adapter at the edge.
- Local records are versioned and exportable. No account, telemetry, or cloud sync is
  required for a module to function.
- The workflow runner is headless-capable but GUI-first in product design: the GUI
  authors and observes runs, while the same plain-Go executor can run an exported
  definition from a desktop or service host.
- Resource limits belong to the runner boundary, not only the React UI. Worker caps,
  memory/CPU admission, disk reserves, cancellation, and child-process containment
  must remain enforceable when no window is open.

The first likely addition is a File Workspace for downloaded outputs, followed by
previewable Batch Tools. A workflow layer comes later, after job history and recovery
are proven. Its GUI-to-headless execution contract, resource governor, and service
targets are documented in [Workflows](workflows.md). See [the product roadmap](product-roadmap.md)
for the sequencing and release gates.

## State Flow

1. The frontend calls `Bootstrap`.
2. The controller loads preferences and ensures `aria2c` is running.
3. The manager returns a typed snapshot containing health, metrics, preferences, and downloads.
4. The service publishes `app:snapshot`.
5. The frontend store reconciles the incoming snapshot and updates the UI.
6. Command methods return a fresh snapshot immediately, while background polling keeps the UI live.

## `aria2c` Resolution Policy

- A user-selected Preferences path has highest priority.
- If no custom path is set, GoBarryGo uses `aria2c` from `PATH`.
- Release builds may embed an `aria2c` fallback and extract it to the user cache when neither of the above is available.
- Distro packages can choose to depend on a system `aria2c` instead of embedding it, but that packaging policy must match the package metadata and third-party notices.

## Wails v3 Alpha Risk Containment

- Wails-specific code is concentrated in `main.go`, `internal/api`, generated bindings, and platform packaging files.
- The download manager core is plain Go and can survive Wails API churn with minimal changes.
- The frontend talks to a compact service contract and two typed events instead of depending on framework internals.

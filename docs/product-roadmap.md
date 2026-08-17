# GoBarryGo product roadmap

Status: direction approved; only the Downloader / Inbox module is shipped.

GoBarryGo is evolving from a downloader into a native, low-overhead general-work
suite. The product should still feel like one tool: one shell, one job model, one
history, and one set of safety conventions. The roadmap is intentionally sequential
so each module can become genuinely useful before the next one is added.

## Product promise

> Small native tools for repeatable work, with the downloader as the first complete
> workflow.

The suite is local-first and transparent. It should work without an account, keep
user files on the user's machine, explain what a job is doing, and make recovery or
rollback understandable. A feature does not belong in the suite just because it is
technically possible.

## Current state: Downloader / Inbox

The `0.0.9 CHITRA` release is the first module and the reference for future work.
It currently provides:

- URL intake for one or many links, with output name, directory, headers, and
  User-Agent overrides.
- A native queue for pause, resume, retry, remove, open, reveal, and global pause /
  resume actions.
- A managed `aria2c` process with health/error visibility and session recovery.
- Live speed, ETA, progress, transfer, connection, and issue signals.
- Preferences for concurrency, splits, connections, allocation, resume, rename, and
  notifications.
- Cross-platform release artifacts and a small Wails/Go/React footprint.

The first module is not finished merely because it downloads a file. It is finished
when the whole path from link to trusted local file is easy to inspect and recover.

## Downloader completion track

These are the next delivery slices, in order. Each slice should be a small release
with a focused test and browser/native QA record.

### D1 — Trustworthy history and search

- Persist completed, failed, cancelled, and removed jobs with timestamps and source
  host.
- Search and filter by filename, host, status, and date.
- Keep a clear distinction between a job record and the file it produced.
- Add export/import of history without copying downloaded file contents.

Gate: a user can find any previous job, understand its final state, and reopen or
reveal its output without restarting the app.

### D2 — Per-job control and recovery

- Per-job concurrency and priority overrides where aria2c supports them.
- Bounded retry with visible backoff and the last meaningful error.
- Graceful aria2c restart and reconciliation after an app or engine crash.
- Duplicate detection by normalized URL plus destination, with an explicit override.

Gate: interrupting the engine or network does not silently duplicate, lose, or mark
a file complete.

### D3 — Integrity and handoff

- Optional checksum input and post-download verification.
- Clear partial, verified, failed, and unknown-integrity states.
- Safe “open”, “reveal”, and “move to workspace” actions with confirmation for
  destructive operations.
- Per-file details for multi-file downloads.

Gate: the user can tell whether a file is merely transferred or actually verified.

### D4 — Network profiles and scheduling

- Named bandwidth/concurrency profiles (for example: Quiet, Normal, Fast).
- Start-at-time and pause-at-time schedules that survive a restart.
- Import/export of settings with secrets and headers clearly excluded or redacted.

Gate: schedules are deterministic, visible, cancellable, and never block ordinary
manual downloads.

## Suite expansion

Only begin a new module after D1–D3 are stable and the shared shell contract exists.

### M1 — File workspace

Purpose: finish the handoff from a network job to local work.

Initial scope:

- A local staging view for recent outputs and folders.
- Rename and move with preview, conflict handling, and an undo-friendly operation
  record.
- Checksum and metadata inspection reused from the downloader.
- Open/reveal actions that respect the operating system and never guess a path.

Not in the first slice: a full file manager, cloud drive, or background index of the
entire disk.

### M2 — Batch tools

Purpose: make repetitive local operations quick without hiding side effects.

Initial scope:

- Batch rename with a preview and reversible operation list.
- Copy, move, archive, and extract jobs with progress and cancellation.
- Hash/verify jobs for a selected set of files.
- A shared job history and error presentation.

Not in the first slice: arbitrary shell execution or opaque “cleaner” actions.

### M3 — Workflows

Purpose: compose proven jobs into small, inspectable routines.

Initial scope:

- A simple ordered workflow: intake → transfer → verify → move.
- Manual run first; scheduling only after recovery is reliable.
- Per-step logs, cancellation, retry policy, and a final summary.

Not in the first slice: a general visual programming language, cloud sync, or a
marketplace of untrusted plugins.

The detailed execution, resource-governor, generated-script, and Windows Server
plan lives in [Workflows](workflows.md).

## Native shell contract

The current UI is downloader-first. When the second module begins, introduce the
smallest shared shell that can host both surfaces:

- A compact module rail with an obvious active module and keyboard navigation.
- A shared job center for active, queued, finished, failed, and cancelled work.
- A shared inspector pattern for inputs, progress, output, warnings, and actions.
- A shared notification and error vocabulary; no silent background work.
- A local data directory with versioned migrations and exportable records.
- A capability boundary: each module owns its domain logic, while the shell owns
  navigation, jobs, settings, and lifecycle.

Keep Wails as transport/packaging glue. Core jobs and safety rules remain plain Go so
they can be tested without a window and survive framework churn.

## Quality and release gates

Every new module must satisfy all of these before it is called shipped:

1. A user-facing problem statement and explicit non-goals.
2. A typed core contract with unit tests independent of Wails.
3. Cancellation, retry, restart, and error states represented in the UI.
4. No destructive default; preview or confirmation where data can be changed.
5. Local-first behavior documented, including where data and logs are stored.
6. Desktop and narrow-window QA, keyboard/focus checks, and no relevant console
   errors.
7. Release artifacts, checksums, install/uninstall notes, and a truthful distribution
   status in `docs/distribution-log.md`.
8. README, product manifest, site metadata, and the portfolio catalog updated in the
   same change.

## Decision log

- **2026-08-17 — Downloader first:** GoBarryGo is not being rebranded or split into
  separate utilities. The existing downloader is the first complete module and the
  quality bar for the suite.
- **2026-08-17 — Native/local-first:** keep the Go + Wails shell small, avoid an
  account/cloud dependency, and preserve inspectable local jobs.
- **2026-08-17 — Staged expansion:** file work, batch tools, and workflows are
  planned but remain clearly marked as future work until their gates pass.
- **2026-08-17 — GUI-first, headless-capable:** the GUI is the authoring and
  observability surface; a shared Go runner can execute exported workflows on a
  desktop or server without making the product CLI-first.

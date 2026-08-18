# GoBarryGo workflows

Status: product design and execution contract; not shipped yet.

Workflows are the long-term reason GoBarryGo becomes more than a downloader. A
workflow is a saved, inspectable sequence of jobs that can be authored in the GUI,
run locally, scheduled, or exported for a headless machine.

The important split is:

- **GUI:** author, preview, configure, run, observe, retry, and inspect workflows.
- **Runner:** execute the same workflow definition without a window.
- **Generated artifacts:** a portable workflow file, a human-readable launcher, and
  eventually a service definition. The GUI remains the primary product surface.

## Product promise

> Build a repeatable job once. Run it safely on your machine or a server.

The first version should feel like a well-designed job list, not a programming
language. A user can add steps, reorder them, set a timer, choose a resource budget,
preview the result, and run it. More granular branching and parallel graphs can come
later without invalidating the first format.

## Shared model: Downloader → Batch → Workflow

All three surfaces produce the same typed job records:

| Surface | Owns | Produces |
| --- | --- | --- |
| Downloader / Inbox | URLs, transfers, resume, integrity | files and download job records |
| Batch Tools | rename, copy, move, archive, hash, inspect | file-operation job records |
| Workflows | order, timing, retry, conditions, budgets | a parent run containing child jobs |

A workflow should compose existing jobs instead of creating separate implementations.
For example:

```text
Download URLs
  → verify checksums
  → rename files from a pattern
  → archive the batch
  → move the artifact to a destination
  → notify with the run summary
```

The same download or batch step must behave the same when started manually, from a
workflow, or from a generated script.

## Workflow v0: linear, useful, inspectable

The first workflow builder is intentionally linear. It supports one step after
another, with small control settings on each step:

- **Built-in steps:** download, wait, copy, move, rename, hash/verify, archive,
  extract, notify, and open/reveal.
- **Process step:** run an explicit external program with declared inputs, working
  directory, environment references, timeout, and output capture. It is opt-in and
  clearly marked as a process boundary.
- **Control settings:** retry count, retry delay, timeout, continue-on-error, and a
  simple success/failure branch.
- **Inputs:** named parameters with types such as text, path, URL, number, choice,
  and secret reference. Values can be filled at run time rather than baked into the
  workflow.
- **Timing:** run now, run once at a time, repeat at an interval, run at startup, or
  run after another workflow completes.
- **Preview:** show the resolved steps, paths, estimated work, and permissions before
  starting.

This is enough to make real routines useful without pretending to be a general visual
programming environment.

## Workflow definition

Use a versioned JSON definition so the GUI, runner, exported script, and future server
controller share one contract. A first shape can look like this:

```json
{
  "format": "gobarrygo.workflow",
  "formatVersion": 1,
  "id": "nightly-release-assets",
  "name": "Nightly release assets",
  "inputs": [
    { "name": "sourceUrl", "type": "url", "required": true },
    { "name": "outputDir", "type": "path", "required": true }
  ],
  "schedule": { "kind": "cron", "expression": "0 2 * * *" },
  "resources": {
    "maxCpuPercent": 70,
    "maxMemoryPercent": 80,
    "maxWorkers": 4,
    "minFreeDiskBytes": 10737418240
  },
  "steps": [
    { "id": "download", "kind": "download", "url": "${sourceUrl}", "directory": "${outputDir}" },
    { "id": "verify", "kind": "hash-verify", "after": ["download"] },
    { "id": "notify", "kind": "notify", "after": ["verify"] }
  ]
}
```

The exact schema will be implemented only after the job core and the first batch
operations are stable. Unknown future fields must be ignored safely or rejected with
a useful version message; they must never be silently misinterpreted.

## Resource governor

Resource safety is a first-class workflow setting, not an advanced afterthought. The
user should be able to choose a preset and then tune the limits:

| Setting | Default policy | Behavior |
| --- | --- | --- |
| CPU | reserve one core or cap at 70% | throttle new work before the machine becomes unresponsive |
| Memory | stop new work at 80%; emergency pause at 85% | pause queued steps, preserve state, and resume when headroom returns |
| Workers | `min(4, logical CPUs)` | bounds parallel downloads and batch operations |
| Disk | reserve at least 10 GiB or a configured percentage | refuse a step that would exhaust the destination |
| Network | unlimited unless a profile is selected | optional Quiet / Normal / Fast bandwidth profiles |
| Child process time | explicit timeout | terminate or pause only according to the step policy |

The 85% value is an emergency ceiling, not a promise that every third-party process
will obey it. The runner controls Go-owned workers directly and uses OS primitives for
child processes where available:

- **Linux:** cgroups v2/systemd scopes where permitted, plus process priority and
  worker-level throttling.
- **Windows / Windows Server:** Job Objects, process priority, service recovery, and
  worker-level throttling.
- **Fallback:** monitor process and host pressure, stop admitting new work, pause
  resumable steps, and show exactly why a run is waiting.

The GUI should expose a live headroom meter, current workers, current memory, and the
next action (`running`, `throttled`, `waiting for memory`, `paused`, or `failed`). A
workflow never silently overwhelms the host to finish faster.

Recommended presets:

- **Quiet:** 50% CPU, 60% memory, 2 workers, conservative network.
- **Balanced:** 70% CPU, 80% memory, up to 4 workers.
- **Fast:** 85% CPU, 85% memory, bounded by physical cores and free disk.
- **Custom:** explicit limits with a warning when the emergency ceiling is raised.

## Generated scripts and service bundles

The GUI should offer **Export workflow** after a successful dry run. Export is a
transparent artifact, not a hidden deployment:

1. `workflow.json` — the versioned source definition.
2. `run.sh` — a readable Linux/macOS launcher.
3. `run.ps1` — a readable Windows launcher.
4. `README.txt` — inputs, required permissions, resource limits, output locations,
   and rollback notes.
5. Later: `gobarrygo-workflow.service` for systemd and a Windows Service install
   manifest.

The generated launcher should call the same headless runner used by the GUI. It may
be distributed as a small bundle containing the runner binary, or call an installed
GoBarryGo runner when the user chooses a lighter export. The GUI must show the exact
command and files before writing them.

Two run modes are useful:

- **Portable run:** execute once from a folder with explicit inputs.
- **Service run:** install a persistent worker with start/stop/status/log commands,
  automatic recovery, and the same resource governor.

The first generated script should not hide arbitrary shell text. Built-in steps are
serialized into the definition; a process step is shown with its command, arguments,
working directory, environment references, and timeout.

## Platform targets

### Linux desktop GUI

- Primary authoring and monitoring target.
- Native desktop window with local runner and optional systemd user service.
- Resource controls can use cgroups when the user grants permission; otherwise use
  cooperative worker throttling and visible pressure handling.

### Windows desktop GUI

- Same authoring experience and local runner.
- Optional “Install as Windows service” action for workflows that should continue
  without the window.
- Use Windows Job Objects for child-process containment and clear elevation prompts.

### Windows Server headless runner

- No GUI dependency at runtime.
- Install, start, stop, inspect, and remove through a generated PowerShell script or
  an administrator-approved service package.
- Store workflow definitions, run history, logs, and artifacts under an explicit data
  directory; never hide them in a temporary folder.
- A later controller can connect from the desktop GUI, but the first server release
  must remain useful and diagnosable without a remote dashboard.

Linux headless service support is a natural follow-on because the runner and resource
model should already be portable; it is not required for the first Windows Server
milestone.

## Safety and security rules

- Read-only preview is the default for database-facing steps; write/destructive steps
  require an explicit capability and confirmation.
- File paths are normalized and checked against declared input/output roots.
- Secrets use OS-backed storage or environment references; they are never written to
  generated scripts, workflow logs, or crash reports by default.
- Network destinations can be restricted by host allowlist in a workflow profile.
- Every run has a stable ID, structured step logs, timestamps, exit reason, and a
  retained summary.
- Cancellation is cooperative first, then escalates only after a visible timeout.
- Restore, overwrite, delete, and service installation always show the target and
  require an explicit confirmation in the GUI or a deliberate `--yes` in a generated
  service command.

## Delivery sequence

### W0 — Shared job core

Typed jobs, cancellation, retries, structured logs, run IDs, persistence, and a
resource governor interface. No workflow builder yet.

### W1 — Batch foundation

Rename, copy, move, hash, archive, and extract as reusable jobs with preview and
conflict policy.

### W2 — Workflow v0

Linear step list, parameters, wait/timer, retry, continue-on-error, dry-run, run
history, and local manual execution.

### W3 — Export

Versioned JSON definition, readable shell/PowerShell launchers, runner bundle, and
exact export preview.

### W4 — Services

Windows Service and Linux systemd integration, startup/recovery policies, logs, and
resource limits enforced at the OS boundary where permitted.

### W5 — Advanced composition

Bounded parallel branches, conditions, foreach over file sets, workflow-to-workflow
triggers, remote targets, and optional GUI control of a server runner.

## Acceptance gates

A workflow release is ready only when:

1. The same definition produces the same result in GUI and headless runner.
2. Dry-run shows every step, path, command boundary, required permission, and limit.
3. Cancellation, retry, restart, and resource throttling are observable in the UI and
   logs.
4. Memory pressure at the configured ceiling pauses safely instead of crashing the
   host or corrupting a partial artifact.
5. Generated scripts are readable, reproducible, and do not contain secrets by
   default.
6. Service install/uninstall and rollback are explicit and tested on the target OS.
7. A failed child step leaves a useful parent-run summary and a resumable state where
   the step permits it.
8. The workflow format is versioned, validated, and documented before public export.


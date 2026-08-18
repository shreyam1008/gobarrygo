# GoBarryGo native UI v1

Status: implementation design contract

References:

- `gobarrygo-native-workspace.png`: primary queue and inspector workspace.
- `gobarrygo-add-download.png`: multi-link add workflow.

## Product intent

GoBarryGo is a small native work shell whose first complete module is a focused
control surface for `aria2c`. The redesign should make the queue faster to scan and
leave room for later local-first work modules without adding cloud accounts,
telemetry, generic analytics, or features that duplicate `aria2c` without improving
its desktop use.

The downloader remains the quality bar: every future module must be as inspectable,
low-overhead, and focused as this workspace.

## Visual system

- Near-black background, graphite surfaces, off-white text, muted steel labels.
- Electric mint is reserved for the active selection, progress, primary action, and
  healthy engine state. Amber and red remain semantic warning/error colors.
- Use 1px borders, very soft elevation, and 6-8px corners. No glass, glow, gradient,
  large marketing typography, or nested card grid.
- Keep the existing Lucide family and use deliberate 13-14px control typography.

## Primary layout

At wide desktop sizes, use three regions:

1. A 220-240px filter and recent-folder rail.
2. A flexible queue table/list as the dominant region.
3. A 330-380px selected-download inspector.

The title bar and quick-add row stay compact. Metrics belong in the queue footer or
small contextual labels, not six equal metric cards. At narrow widths, hide or move the
inspector behind a selection detail view before compressing the queue into unreadable
columns.

## Queue contract

Each row should make these facts scannable: filename, source host, progress, speed,
ETA, transferred/total size, and status. Preserve virtualization and keyboard behavior.
Do not remove file actions or aria2 health/error visibility merely to match the image.

## Add workflow

The dialog keeps the existing functional fields: multiple URLs, output name,
destination, recent folders, headers, and User-Agent. It should show the parsed valid
link count and use a count-aware primary label such as `Queue 3`. Advanced request
fields remain collapsed by default.

## Intentional concept corrections

- Keep the real product version and codename; the mockup's example versions are not
  product data.
- Keep GoBarryGo's current filters (`All`, `Active`, `Queued`, `Paused`, `Done`,
  `Issues`) rather than the second mockup's generic history vocabulary.
- Do not add the second mockup's speed chart unless measured usage shows that it is
  more useful than transport/file details.
- Preserve engine health, retry, delete-with-files confirmation, upload speed, and
  multi-file inspection even when the concept does not show every state.

## Acceptance checks

- Existing store/model tests pass and the production bundle stays within budget.
- Quick add, multi-link add, filter/search, selection, pause/resume, retry, open,
  reveal, delete confirmation, preferences, and health-error states remain usable.
- 1536x1024 matches the reference hierarchy and density closely.
- 1024px and a narrow desktop viewport do not clip the queue or trap scrolling.
- No relevant browser console error and no regression to keyboard shortcuts or focus.

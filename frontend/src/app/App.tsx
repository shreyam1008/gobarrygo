import {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Activity,
  ArrowDownToLine,
  ClipboardPaste,
  Download,
  FolderOpen,
  Gauge,
  HardDrive,
  ListFilter,
  Pause,
  Play,
  Plus,
  RefreshCcw,
  Search,
  Settings,
  SlidersHorizontal,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import { appStore, useAppState } from "@/lib/store/app-store";
import { buildDownloadDashboard, parseDownloadURLs } from "@/lib/download-model";
import { formatBytes, formatETA, formatPercent, formatSpeed } from "@/lib/format";
import { HealthBanner } from "@/features/health/health-banner";
import { AddDownloadDialog } from "@/features/downloads/add-download-dialog";
import { DownloadRow } from "@/features/downloads/download-row";
import { InspectorPanel } from "@/features/downloads/inspector-panel";
import { PreferencesDialog } from "@/features/preferences/preferences-dialog";
import type { DownloadFilter, DownloadItem } from "@/types/contracts";

const filters: Array<{ key: DownloadFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "waiting", label: "Queued" },
  { key: "paused", label: "Paused" },
  { key: "complete", label: "Done" },
  { key: "error", label: "Issues" },
];

const rowHeight = 88;
const rowOverscan = 8;

export function App() {
  const state = useAppState();
  const searchRef = useRef<HTMLInputElement>(null);
  const [quickURLs, setQuickURLs] = useState("");
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const deferredSearch = useDeferredValue(state.search);

  useEffect(() => {
    void appStore.bootstrap();
    return () => {
      appStore.dispose();
    };
  }, []);

  const dashboard = useMemo(
    () => buildDownloadDashboard(state.snapshot.downloads, state.filter, deferredSearch),
    [state.snapshot.downloads, state.filter, deferredSearch],
  );

  const selectedDownload = useMemo(
    () => state.snapshot.downloads.find((item) => item.gid === state.selectedGID),
    [state.snapshot.downloads, state.selectedGID],
  );

  const directoryOptions = useMemo(
    () =>
      uniqueNonEmpty([
        state.quickDirectory,
        state.snapshot.preferences.downloadDirectory,
        ...state.recentDirectories,
        ...dashboard.recentDirectories.slice(0, 5).map((item) => item.directory),
      ]),
    [
      state.quickDirectory,
      state.snapshot.preferences.downloadDirectory,
      state.recentDirectories,
      dashboard.recentDirectories,
    ],
  );

  const quickDirectory = state.quickDirectory || state.snapshot.preferences.downloadDirectory;
  const quickDirectoryOptions = directoryOptions.length > 0 ? directoryOptions : [""];
  const parsedQuickURLs = useMemo(() => parseDownloadURLs(quickURLs), [quickURLs]);
  const overallProgress = dashboard.totalBytes > 0
    ? (dashboard.completedBytes / dashboard.totalBytes) * 100
    : 0;

  const submitQuickDownload = useCallback(async () => {
    if (parsedQuickURLs.length === 0) {
      appStore.openAddDialog();
      return;
    }

    setQuickSubmitting(true);
    try {
      const success = await appStore.submitDownload({
        urlsText: quickURLs,
        outputName: "",
        directory: quickDirectory,
        headersText: "",
        userAgent: state.snapshot.preferences.userAgent,
      });
      if (success) {
        setQuickURLs("");
      }
    } finally {
      setQuickSubmitting(false);
    }
  }, [parsedQuickURLs.length, quickDirectory, quickURLs, state.snapshot.preferences.userAgent]);

  const pasteIntoQuickAdd = useCallback(async () => {
    try {
      const clipboardText = await navigator.clipboard?.readText();
      if (clipboardText) {
        setQuickURLs((current) => [current, clipboardText].filter(Boolean).join("\n"));
      }
    } catch {
      appStore.openAddDialog();
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const editingText =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n") {
        event.preventDefault();
        appStore.openAddDialog();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }

      if (editingText || !selectedDownload) {
        return;
      }

      if (event.key === " " && (selectedDownload.status === "active" || selectedDownload.status === "waiting")) {
        event.preventDefault();
        void appStore.pauseDownload(selectedDownload.gid);
      } else if (event.key === " " && selectedDownload.status === "paused") {
        event.preventDefault();
        void appStore.resumeDownload(selectedDownload.gid);
      } else if (event.key === "Enter" && selectedDownload.status === "complete") {
        event.preventDefault();
        void appStore.openDownloadedFile(selectedDownload.gid);
      } else if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        void appStore.removeDownload(selectedDownload.gid, false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedDownload]);

  return (
    <div className="app-shell">
      <header className="titlebar">
        <div className="titlebar__identity">
          <span className="app-mark">
            <ArrowDownToLine size={18} />
          </span>
          <div>
            <strong>GoBarryGo</strong>
            <span>{state.snapshot.version.number} {state.snapshot.version.codename}</span>
          </div>
        </div>

        <div className="titlebar__status" data-ready={state.snapshot.health.ready}>
          <span />
          {state.snapshot.health.ready ? `RPC ${state.snapshot.health.rpcPort}` : "Engine setup needed"}
        </div>

        <div className="titlebar__actions">
          <button type="button" className="tool-button tool-button--primary" onClick={() => appStore.openAddDialog()}>
            <Plus size={16} />
            Add
          </button>
          <button type="button" className="tool-button" onClick={() => void appStore.pauseAll()} title="Pause all">
            <Pause size={16} />
          </button>
          <button type="button" className="tool-button" onClick={() => void appStore.resumeAll()} title="Resume all">
            <Play size={16} />
          </button>
          <button type="button" className="tool-button" onClick={() => void appStore.openDownloadDirectory()} title="Open download folder">
            <FolderOpen size={16} />
          </button>
          <button type="button" className="tool-button" onClick={() => appStore.openPreferences()} title="Preferences">
            <Settings size={16} />
          </button>
        </div>
      </header>

      {!state.snapshot.health.ready ? (
        <HealthBanner
          health={state.snapshot.health}
          preferences={state.snapshot.preferences}
        />
      ) : null}

      <section className="quick-add-panel" aria-label="Quick add download">
        <div className="quick-add-panel__input">
          <Download size={17} />
          <textarea
            rows={2}
            placeholder="Paste one or many download links"
            value={quickURLs}
            onChange={(event) => setQuickURLs(event.target.value)}
          />
          {quickURLs ? (
            <button type="button" className="icon-button" onClick={() => setQuickURLs("")} aria-label="Clear quick add" title="Clear">
              <X size={16} />
            </button>
          ) : null}
        </div>

        <div className="quick-add-panel__meta">
          <div className="location-select">
            <HardDrive size={15} />
            <select
              value={quickDirectory}
              onChange={(event) => appStore.setQuickDirectory(event.target.value)}
              aria-label="Quick add download folder"
            >
              {quickDirectoryOptions.map((directory) => (
                <option key={directory || "default"} value={directory}>
                  {directory || "Default download folder"}
                </option>
              ))}
            </select>
          </div>
          <button type="button" className="tool-button" onClick={pasteIntoQuickAdd}>
            <ClipboardPaste size={16} />
            Paste
          </button>
          <button
            type="button"
            className="tool-button tool-button--primary"
            disabled={quickSubmitting}
            onClick={() => void submitQuickDownload()}
          >
            <Zap size={16} />
            {parsedQuickURLs.length > 1 ? `Queue ${parsedQuickURLs.length}` : "Queue"}
          </button>
        </div>
      </section>

      <main className="app-workspace">
        <aside className="sidebar" aria-label="Download navigation">
          <section className="sidebar-section">
            <div className="section-heading">
              <ListFilter size={15} />
              <span>Queue</span>
            </div>
            <div className="filter-list">
              {filters.map((filter) => {
                const count = filter.key === "all"
                  ? state.snapshot.downloads.length
                  : dashboard.counts[filter.key] ?? 0;
                return (
                  <button
                    key={filter.key}
                    type="button"
                    className={`filter-row ${state.filter === filter.key ? "filter-row--active" : ""}`}
                    onClick={() => appStore.setFilter(filter.key)}
                  >
                    <span>{filter.label}</span>
                    <strong>{count}</strong>
                  </button>
                );
              })}
            </div>
          </section>

          {directoryOptions.length > 0 && (
            <section className="sidebar-section">
              <div className="section-heading">
                <HardDrive size={15} />
                <span>Locations</span>
              </div>
              <div className="location-list">
                {directoryOptions.slice(0, 6).map((directory) => (
                  <button
                    key={directory}
                    type="button"
                    className={`location-row ${quickDirectory === directory ? "location-row--active" : ""}`}
                    onClick={() => appStore.setQuickDirectory(directory)}
                    title={directory}
                  >
                    <FolderOpen size={14} />
                    <span>{directory}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="sidebar-section about-panel">
            <div className="section-heading">
              <UserRound size={15} />
              <span>About</span>
            </div>
            <p>By Shreyam Adhikari, also known as shreyam1008.</p>
            <div className="about-links">
              <button type="button" onClick={() => void appStore.openWebsite("https://shreyam1008.github.io/gobarrygo/")}>
                Project site
              </button>
              <button type="button" onClick={() => void appStore.openWebsite("https://github.com/shreyam1008/gobarrygo")}>
                GitHub repo
              </button>
              <button type="button" onClick={() => void appStore.openWebsite("https://github.com/shreyam1008")}>
                @shreyam1008
              </button>
              <button type="button" onClick={() => void appStore.openWebsite("https://shreyam1008.com.np")}>
                shreyam1008.com.np
              </button>
            </div>
          </section>

          <section className="sidebar-section sidebar-section--metrics">
            <MetricLine icon={<Activity size={15} />} label="Speed" value={formatSpeed(dashboard.totalSpeed)} />
            <MetricLine icon={<Gauge size={15} />} label="Progress" value={formatPercent(overallProgress)} />
            <MetricLine icon={<HardDrive size={15} />} label="Stored" value={`${formatBytes(dashboard.completedBytes)} / ${formatBytes(dashboard.totalBytes)}`} />
          </section>
        </aside>

        <section className="queue-panel" aria-label="Downloads">
          <div className="queue-toolbar">
            <div>
              <h1>Downloads</h1>
              <p>{dashboard.filteredDownloads.length} shown from {state.snapshot.downloads.length} tracked</p>
            </div>
            <div className="queue-toolbar__tools">
              <label className="search-box">
                <Search size={16} />
                <input
                  ref={searchRef}
                  type="search"
                  placeholder="Search files or folders"
                  value={state.search}
                  onChange={(event) => appStore.setSearch(event.target.value)}
                />
                {state.search ? (
                  <button type="button" onClick={() => appStore.clearSearch()} aria-label="Clear search" title="Clear search">
                    <X size={14} />
                  </button>
                ) : null}
              </label>
              <button type="button" className="tool-button" onClick={() => void appStore.refresh()} title="Refresh">
                <RefreshCcw size={16} />
              </button>
            </div>
          </div>

          <div className="queue-header" aria-hidden="true">
            <span>File</span>
            <span>Progress</span>
            <span>Transfer</span>
            <span>Folder</span>
            <span>Actions</span>
          </div>

          <VirtualDownloadList
            downloads={dashboard.filteredDownloads}
            loading={state.loading}
            selectedGID={state.selectedGID}
            onSelect={(gid) => appStore.setSelectedGID(gid)}
          />
        </section>

        <InspectorPanel item={selectedDownload} />
      </main>

      <footer className="statusbar">
        <span>{state.snapshot.downloads.length} tracked</span>
        <span>{formatSpeed(state.snapshot.metrics.downloadSpeed)} down</span>
        <span>{formatSpeed(state.snapshot.metrics.uploadSpeed)} up</span>
        <span>{dashboard.activeBytesRemaining > 0 ? `${formatBytes(dashboard.activeBytesRemaining)} remaining active` : "No active backlog"}</span>
      </footer>

      <AddDownloadDialog
        open={state.addDialogOpen}
        defaultDirectory={state.snapshot.preferences.downloadDirectory}
        recentDirectories={directoryOptions}
        onClose={() => appStore.closeAddDialog()}
      />

      <PreferencesDialog
        open={state.preferencesOpen}
        preferences={state.snapshot.preferences}
        onClose={() => appStore.closePreferences()}
      />

      {(state.error || state.toasts.length > 0) ? (
        <div className="toast-stack" aria-live="polite" aria-atomic="false">
          {state.error ? (
            <div className="toast toast--error">
              <strong>Startup problem</strong>
              <span>{state.error}</span>
            </div>
          ) : null}
          {state.toasts.map((toast) => (
            <div key={toast.id} className={`toast toast--${toast.kind || "info"}`}>
              <strong>{toast.title}</strong>
              <span>{toast.message}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const VirtualDownloadList = memo(function VirtualDownloadList({
  downloads,
  loading,
  selectedGID,
  onSelect,
}: {
  downloads: DownloadItem[];
  loading: boolean;
  selectedGID: string | null;
  onSelect: (gid: string) => void;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ height: 520, scrollTop: 0 });

  const measure = useCallback(() => {
    const node = viewportRef.current;
    if (!node) {
      return;
    }
    setViewport({
      height: node.clientHeight || 520,
      scrollTop: node.scrollTop,
    });
  }, []);

  useEffect(() => {
    measure();
    const node = viewportRef.current;
    if (!node || typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [measure]);

  const start = Math.max(0, Math.floor(viewport.scrollTop / rowHeight) - rowOverscan);
  const visibleCount = Math.ceil(viewport.height / rowHeight) + rowOverscan * 2;
  const end = Math.min(downloads.length, start + visibleCount);
  const visibleDownloads = downloads.slice(start, end);

  if (loading) {
    return (
      <div className="queue-empty">
        <SlidersHorizontal size={18} />
        <span>Starting the download engine.</span>
      </div>
    );
  }

  if (downloads.length === 0) {
    return (
      <div className="queue-empty">
        <Download size={18} />
        <span>No downloads match this view.</span>
      </div>
    );
  }

  return (
    <div
      ref={viewportRef}
      className="download-list"
      onScroll={measure}
      data-rendered={`${visibleDownloads.length}/${downloads.length}`}
    >
      <div className="download-list__spacer" style={{ height: downloads.length * rowHeight }}>
        <div className="download-list__window" style={{ transform: `translateY(${start * rowHeight}px)` }}>
          {visibleDownloads.map((item) => (
            <div key={item.gid} className="download-list__slot">
              <DownloadRow
                item={item}
                selected={selectedGID === item.gid}
                onSelect={onSelect}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

function MetricLine({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="metric-line">
      <span>{icon}{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function uniqueNonEmpty(values: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    output.push(trimmed);
  }
  return output;
}

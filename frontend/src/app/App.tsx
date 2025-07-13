import { useDeferredValue, useEffect } from "react";
import { Download, FolderOpen, Pause, Play, RefreshCcw, Settings, Sparkles } from "lucide-react";
import { appStore, useAppState } from "@/lib/store/app-store";
import { formatSpeed } from "@/lib/format";
import { HealthBanner } from "@/features/health/health-banner";
import { AddDownloadDialog } from "@/features/downloads/add-download-dialog";
import { DownloadRow } from "@/features/downloads/download-row";
import { InspectorPanel } from "@/features/downloads/inspector-panel";
import { PreferencesDialog } from "@/features/preferences/preferences-dialog";
import { StatCard } from "@/features/downloads/stat-card";

const filters: Array<{ key: "all" | "active" | "waiting" | "paused" | "complete" | "error"; label: string }> = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "waiting", label: "Queue" },
  { key: "paused", label: "Paused" },
  { key: "complete", label: "Complete" },
  { key: "error", label: "Errors" },
];

export function App() {
  const state = useAppState();
  const deferredSearch = useDeferredValue(state.search.toLowerCase().trim());

  useEffect(() => {
    void appStore.bootstrap();
    return () => {
      appStore.dispose();
    };
  }, []);

  const filteredDownloads = state.snapshot.downloads.filter((item) => {
    const matchesFilter = state.filter === "all" || item.status === state.filter;
    const matchesSearch =
      deferredSearch.length === 0 ||
      item.name.toLowerCase().includes(deferredSearch) ||
      item.directory.toLowerCase().includes(deferredSearch);
    return matchesFilter && matchesSearch;
  });

  const selectedDownload = filteredDownloads.find((item) => item.gid === state.selectedGID) ??
    state.snapshot.downloads.find((item) => item.gid === state.selectedGID);

  return (
    <div className="shell">
      <header className="hero">
        <div className="hero__copy">
          <span className="hero__eyebrow">GoBarryGo {state.snapshot.version.number} {state.snapshot.version.codename}</span>
          <h1>aria2 speed with a desktop control surface that stays lean.</h1>
          <p>
            Tune split count, connections per host, recovery behavior, and output location
            without carrying the weight of an electron-scale download manager.
          </p>
        </div>

        <div className="hero__actions">
          <button type="button" className="primary-button" onClick={() => appStore.openAddDialog()}>
            <Download size={16} />
            Add download
          </button>
          <button type="button" className="secondary-button" onClick={() => void appStore.pauseAll()}>
            <Pause size={16} />
            Pause all
          </button>
          <button type="button" className="secondary-button" onClick={() => void appStore.resumeAll()}>
            <Play size={16} />
            Resume all
          </button>
          <button type="button" className="secondary-button" onClick={() => void appStore.openDownloadDirectory()}>
            <FolderOpen size={16} />
            Open folder
          </button>
          <button type="button" className="secondary-button" onClick={() => appStore.openPreferences()}>
            <Settings size={16} />
            Preferences
          </button>
        </div>
      </header>

      <HealthBanner health={state.snapshot.health} />

      <section className="stats-row">
        <StatCard
          label="Active"
          value={String(state.snapshot.metrics.activeCount)}
          detail={`${formatSpeed(state.snapshot.metrics.downloadSpeed)} inbound`}
        />
        <StatCard
          label="Queue"
          value={String(state.snapshot.metrics.waitingCount)}
          detail="Waiting for bandwidth"
        />
        <StatCard
          label="History"
          value={String(state.snapshot.metrics.stoppedCount)}
          detail="Completed, removed, or failed"
        />
        <StatCard
          label="Engine"
          value={state.snapshot.health.ready ? "Ready" : "Setup"}
          detail={state.snapshot.health.ready ? `RPC ${state.snapshot.health.rpcPort}` : "Pick aria2c path"}
        />
      </section>

      <section className="workspace">
        <div className="downloads-panel">
          <div className="downloads-panel__toolbar">
            <div className="downloads-panel__toolbar-left">
              <div className="search-field">
                <input
                  type="search"
                  placeholder="Search downloads or folders"
                  value={state.search}
                  onChange={(event) => appStore.setSearch(event.target.value)}
                />
              </div>
              <div className="filter-group">
                {filters.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    className={`filter-chip ${state.filter === filter.key ? "filter-chip--active" : ""}`}
                    onClick={() => appStore.setFilter(filter.key)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <button type="button" className="secondary-button" onClick={() => void appStore.refresh()}>
              <RefreshCcw size={16} />
              Refresh
            </button>
          </div>

          <div className="downloads-panel__list">
            {state.loading ? (
              <div className="empty-state">
                <Sparkles size={18} />
                <p>Booting the controller and probing aria2c.</p>
              </div>
            ) : null}

            {!state.loading && filteredDownloads.length === 0 ? (
              <div className="empty-state">
                <Sparkles size={18} />
                <p>No downloads match the current filter.</p>
              </div>
            ) : null}

            {filteredDownloads.map((item) => (
              <DownloadRow
                key={item.gid}
                item={item}
                selected={state.selectedGID === item.gid}
                onSelect={(gid) => appStore.setSelectedGID(gid)}
              />
            ))}
          </div>
        </div>

        <InspectorPanel item={selectedDownload} />
      </section>

      <footer className="app-footer">
        <span>{state.snapshot.downloads.length} tracked downloads</span>
        <button
          type="button"
          className="footer-link"
          onClick={() => void appStore.openWebsite("https://github.com/shreyam1008/gobarrygo")}
        >
          Project website
        </button>
      </footer>

      <AddDownloadDialog
        open={state.addDialogOpen}
        defaultDirectory={state.snapshot.preferences.downloadDirectory}
        onClose={() => appStore.closeAddDialog()}
      />

      <PreferencesDialog
        open={state.preferencesOpen}
        preferences={state.snapshot.preferences}
        onClose={() => appStore.closePreferences()}
      />

      {state.error ? (
        <div className="toast-stack">
          <div className="toast toast--error">
            <strong>Startup problem</strong>
            <span>{state.error}</span>
          </div>
        </div>
      ) : null}

      <div className="toast-stack">
        {state.toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.kind || "info"}`}>
            <strong>{toast.title}</strong>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

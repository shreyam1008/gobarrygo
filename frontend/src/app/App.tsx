import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { AddDownloadDialog } from "@/features/downloads/add-download-dialog";
import { DownloadQueue } from "@/features/downloads/download-queue";
import { InspectorPanel } from "@/features/downloads/inspector-panel";
import { HealthBanner } from "@/features/health/health-banner";
import { NavigationRail } from "@/features/navigation/navigation-rail";
import { PreferencesDialog } from "@/features/preferences/preferences-dialog";
import { AppTitlebar } from "@/features/shell/app-titlebar";
import { QuickAddBar } from "@/features/shell/quick-add-bar";
import { buildDownloadDashboard } from "@/lib/download-model";
import { appStore, useAppState } from "@/lib/store/app-store";

export function App() {
  const state = useAppState();
  const searchRef = useRef<HTMLInputElement>(null);
  const deferredSearch = useDeferredValue(state.search);
  const [detailsOpen, setDetailsOpen] = useState(false);

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
    () => uniqueNonEmpty([
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const editingOrInteractive = Boolean(target?.closest(
        "input, textarea, select, button, a, summary, [contenteditable='true']",
      ));
      const targetRow = target?.closest<HTMLElement>("[data-download-gid]");
      const shortcutGID = targetRow?.dataset.downloadGid || selectedDownload?.gid;
      const shortcutStatus = targetRow?.dataset.st || selectedDownload?.status;
      const modalOpen = state.addDialogOpen || state.preferencesOpen;

      if (modalOpen) {
        return;
      }

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

      if (event.key === "Escape" && detailsOpen) {
        setDetailsOpen(false);
        return;
      }

      if (editingOrInteractive || !shortcutGID) {
        return;
      }

      if (event.key === " " && (shortcutStatus === "active" || shortcutStatus === "waiting")) {
        event.preventDefault();
        void appStore.pauseDownload(shortcutGID);
      } else if (event.key === " " && shortcutStatus === "paused") {
        event.preventDefault();
        void appStore.resumeDownload(shortcutGID);
      } else if (event.key === "Enter" && shortcutStatus === "complete") {
        event.preventDefault();
        void appStore.openDownloadedFile(shortcutGID);
      } else if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        void appStore.removeDownload(shortcutGID, false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [detailsOpen, selectedDownload, state.addDialogOpen, state.preferencesOpen]);

  return (
    <div className="shell">
      <AppTitlebar
        version={state.snapshot.version}
        health={state.snapshot.health}
      />

      <QuickAddBar
        directory={quickDirectory}
        directoryOptions={directoryOptions.length > 0 ? directoryOptions : [""]}
        defaultUserAgent={state.snapshot.preferences.userAgent}
      />

      {!state.snapshot.health.ready ? (
        <HealthBanner
          health={state.snapshot.health}
          preferences={state.snapshot.preferences}
        />
      ) : null}

      <main className={`workspace ${detailsOpen ? "workspace--details" : ""}`}>
        <NavigationRail
          currentFilter={state.filter}
          downloads={state.snapshot.downloads}
          counts={dashboard.counts}
          directoryOptions={directoryOptions}
          quickDirectory={quickDirectory}
        />

        <DownloadQueue
          dashboard={dashboard}
          metrics={state.snapshot.metrics}
          peakDownloadSpeed={state.peakDownloadSpeed}
          loading={state.loading}
          search={state.search}
          searchRef={searchRef}
          selectedGID={state.selectedGID}
          onShowDetails={() => setDetailsOpen(true)}
        />

        <InspectorPanel item={selectedDownload} onClose={() => setDetailsOpen(false)} />
      </main>

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

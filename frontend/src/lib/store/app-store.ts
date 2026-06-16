import { startTransition, useSyncExternalStore } from "react";
import {
  AddDownloadRequest,
  AppSnapshot,
  Notification,
  Preferences,
  RemoveDownloadRequest,
} from "@bindings/github.com/shreyam1008/gobarrygo/internal/contracts/models.js";
import {
  addDownload,
  bootstrap,
  onNotification,
  onSnapshot,
  openDownloadDirectory,
  openDownloadedFile,
  openDownloadFolder,
  openWebsite,
  pauseAll,
  pauseDownload,
  pickAria2Binary,
  pickDownloadDirectory,
  refresh,
  removeDownload,
  resumeAll,
  resumeDownload,
  revealPreferencesFile,
  retryDownload,
  savePreferences,
  type Unsubscribe,
} from "@/lib/wails/client";
import { parseDownloadURLs } from "@/lib/download-model";
import type { DownloadFilter } from "@/types/contracts";

type Toast = Notification & {
  id: string;
};

type PersistedUIState = {
  selectedGID?: string | null;
  filter?: DownloadFilter;
  search?: string;
  quickDirectory?: string;
  recentDirectories?: string[];
};

type AppState = {
  snapshot: AppSnapshot;
  loading: boolean;
  error: string | null;
  selectedGID: string | null;
  filter: DownloadFilter;
  search: string;
  quickDirectory: string;
  recentDirectories: string[];
  addDialogOpen: boolean;
  preferencesOpen: boolean;
  toasts: Toast[];
};

type Listener = () => void;

const defaultSnapshot = new AppSnapshot();
const uiStorageKey = "gobarrygo.ui.v1";
const validFilters: DownloadFilter[] = ["all", "active", "waiting", "paused", "complete", "error"];
const maxRecentDirectories = 6;

function loadPersistedUIState(): PersistedUIState {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(uiStorageKey);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as PersistedUIState;
    return {
      selectedGID: typeof parsed.selectedGID === "string" ? parsed.selectedGID : null,
      filter: parsed.filter && validFilters.includes(parsed.filter) ? parsed.filter : "all",
      search: typeof parsed.search === "string" ? parsed.search : "",
      quickDirectory: typeof parsed.quickDirectory === "string" ? parsed.quickDirectory : "",
      recentDirectories: normalizeDirectories(parsed.recentDirectories ?? []),
    };
  } catch {
    return {};
  }
}

function persistUIState(state: AppState): void {
  if (typeof window === "undefined") {
    return;
  }

  const payload: PersistedUIState = {
    selectedGID: state.selectedGID,
    filter: state.filter,
    search: state.search,
    quickDirectory: state.quickDirectory,
    recentDirectories: state.recentDirectories,
  };

  try {
    window.localStorage.setItem(uiStorageKey, JSON.stringify(payload));
  } catch {
    // Ignore storage failures in locked-down webviews.
  }
}

function normalizeDirectories(values: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const value of values) {
    const directory = value.trim();
    if (!directory || seen.has(directory)) {
      continue;
    }
    seen.add(directory);
    normalized.push(directory);
    if (normalized.length >= maxRecentDirectories) {
      break;
    }
  }

  return normalized;
}

function shouldPersist(previous: AppState, next: AppState, partial: Partial<AppState>): boolean {
  if (
    "selectedGID" in partial &&
    previous.selectedGID !== next.selectedGID
  ) {
    return true;
  }
  if ("filter" in partial && previous.filter !== next.filter) {
    return true;
  }
  if ("search" in partial && previous.search !== next.search) {
    return true;
  }
  if (
    "quickDirectory" in partial &&
    previous.quickDirectory !== next.quickDirectory
  ) {
    return true;
  }
  if (
    "recentDirectories" in partial &&
    previous.recentDirectories.join("\n") !== next.recentDirectories.join("\n")
  ) {
    return true;
  }
  return false;
}

const persistedUIState = loadPersistedUIState();

class AppStore {
  private listeners = new Set<Listener>();
  private unsubs: Unsubscribe[] = [];
  private bootstrapped = false;
  private persistTimer: number | undefined;

  private state: AppState = {
    snapshot: defaultSnapshot,
    loading: true,
    error: null,
    selectedGID: persistedUIState.selectedGID ?? null,
    filter: persistedUIState.filter ?? "all",
    search: persistedUIState.search ?? "",
    quickDirectory: persistedUIState.quickDirectory ?? "",
    recentDirectories: persistedUIState.recentDirectories ?? [],
    addDialogOpen: false,
    preferencesOpen: false,
    toasts: [],
  };

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getState = (): AppState => this.state;

  bootstrap = async (): Promise<void> => {
    if (this.bootstrapped) {
      return;
    }

    this.bootstrapped = true;
    this.registerEvents();
    this.patch({ loading: true, error: null });

    try {
      const snapshot = await bootstrap();
      this.applySnapshot(snapshot);
      this.patch({ loading: false });
    } catch (error) {
      this.patch({
        loading: false,
        error: error instanceof Error ? error.message : "Failed to bootstrap the app",
      });
    }
  };

  dispose = (): void => {
    for (const unsub of this.unsubs) {
      void unsub();
    }
    this.unsubs = [];
    this.bootstrapped = false;
    if (this.persistTimer !== undefined) {
      window.clearTimeout(this.persistTimer);
      this.persistTimer = undefined;
    }
  };

  setSearch = (value: string): void => {
    this.patch({ search: value });
  };

  setFilter = (value: DownloadFilter): void => {
    this.patch({ filter: value });
  };

  clearSearch = (): void => {
    this.patch({ search: "" });
  };

  setSelectedGID = (gid: string | null): void => {
    this.patch({ selectedGID: gid });
  };

  setQuickDirectory = (value: string): void => {
    this.patch({ quickDirectory: value });
  };

  rememberDirectory = (value: string): void => {
    const directories = normalizeDirectories([value, ...this.state.recentDirectories]);
    this.patch({ recentDirectories: directories });
  };

  openAddDialog = (): void => {
    this.patch({ addDialogOpen: true });
  };

  closeAddDialog = (): void => {
    this.patch({ addDialogOpen: false });
  };

  openPreferences = (): void => {
    this.patch({ preferencesOpen: true });
  };

  closePreferences = (): void => {
    this.patch({ preferencesOpen: false });
  };

  dismissToast = (id: string): void => {
    this.patch({
      toasts: this.state.toasts.filter((toast) => toast.id !== id),
    });
  };

  submitDownload = async (input: {
    urlsText: string;
    outputName: string;
    directory: string;
    headersText: string;
    userAgent: string;
  }): Promise<boolean> => {
    const urls = parseDownloadURLs(input.urlsText);

    const headers = input.headersText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (urls.length === 0) {
      this.pushToast({
        kind: "error",
        title: "Missing URL",
        message: "Enter at least one download URL.",
      });
      return false;
    }

    try {
      const snapshot = await addDownload(
        new AddDownloadRequest({
          urls,
          outputName: input.outputName.trim(),
          directory: input.directory.trim(),
          headers,
          userAgent: input.userAgent.trim(),
        }),
      );
      this.applySnapshot(snapshot);
      this.rememberDirectory(input.directory.trim() || snapshot.preferences.downloadDirectory);
      this.pushToast({
        kind: "success",
        title: "Download queued",
        message: urls.length === 1 ? urls[0] : `${urls.length} URLs added`,
      });
      this.patch({ addDialogOpen: false });
      return true;
    } catch (error) {
      this.pushToast({
        kind: "error",
        title: "Add download failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  };

  savePreferences = async (prefs: Preferences): Promise<boolean> => {
    try {
      const snapshot = await savePreferences(prefs);
      this.applySnapshot(snapshot);
      this.rememberDirectory(snapshot.preferences.downloadDirectory);
      this.pushToast({
        kind: "success",
        title: "Preferences saved",
        message: "Download behavior and folders were updated.",
      });
      this.patch({ preferencesOpen: false });
      return true;
    } catch (error) {
      this.pushToast({
        kind: "error",
        title: "Preferences not saved",
        message: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  };

  refresh = async (): Promise<void> => {
    const snapshot = await refresh();
    this.applySnapshot(snapshot);
  };

  pauseAll = async (): Promise<void> => {
    const snapshot = await pauseAll();
    this.applySnapshot(snapshot);
  };

  resumeAll = async (): Promise<void> => {
    const snapshot = await resumeAll();
    this.applySnapshot(snapshot);
  };

  pauseDownload = async (gid: string): Promise<void> => {
    const snapshot = await pauseDownload(gid);
    this.applySnapshot(snapshot);
  };

  resumeDownload = async (gid: string): Promise<void> => {
    const snapshot = await resumeDownload(gid);
    this.applySnapshot(snapshot);
  };

  retryDownload = async (gid: string): Promise<void> => {
    const snapshot = await retryDownload(gid);
    this.applySnapshot(snapshot);
  };

  removeDownload = async (gid: string, deleteFiles: boolean): Promise<void> => {
    const snapshot = await removeDownload(
      new RemoveDownloadRequest({
        gid,
        deleteFiles,
      }),
    );
    this.applySnapshot(snapshot);
  };

  openDownloadedFile = async (gid: string): Promise<void> => {
    await openDownloadedFile(gid);
  };

  openDownloadFolder = async (gid: string): Promise<void> => {
    await openDownloadFolder(gid);
  };

  openDownloadDirectory = async (): Promise<void> => {
    await openDownloadDirectory();
  };

  pickDownloadDirectory = async (): Promise<string> => {
    return pickDownloadDirectory();
  };

  pickAria2Binary = async (): Promise<string> => {
    return pickAria2Binary();
  };

  revealPreferencesFile = async (): Promise<void> => {
    await revealPreferencesFile();
  };

  openWebsite = async (url: string): Promise<void> => {
    await openWebsite(url);
  };

  private registerEvents(): void {
    if (this.unsubs.length > 0) {
      return;
    }

    this.unsubs.push(
      onSnapshot((snapshot) => {
        startTransition(() => {
          this.applySnapshot(snapshot);
        });
      }),
    );

    this.unsubs.push(
      onNotification((notification) => {
        startTransition(() => {
          this.pushToast(notification);
        });
      }),
    );
  }

  private applySnapshot(snapshot: AppSnapshot): void {
    const selectedExists =
      this.state.selectedGID &&
      snapshot.downloads.some((item) => item.gid === this.state.selectedGID);
    const recentDirectories = normalizeDirectories([
      snapshot.preferences.downloadDirectory,
      ...snapshot.downloads.map((item) => item.directory),
      ...this.state.recentDirectories,
    ]);

    this.patch({
      snapshot,
      loading: false,
      error: null,
      selectedGID: selectedExists
        ? this.state.selectedGID
        : snapshot.downloads[0]?.gid ?? null,
      quickDirectory: this.state.quickDirectory || snapshot.preferences.downloadDirectory,
      recentDirectories,
    });
  }

  private pushToast(notification: Notification): void {
    const toast: Toast = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      kind: notification.kind || "info",
      title: notification.title,
      message: notification.message,
    };

    this.patch({
      toasts: [toast, ...this.state.toasts].slice(0, 5),
    });

    window.setTimeout(() => {
      this.dismissToast(toast.id);
    }, 4500);
  }

  private patch(partial: Partial<AppState>): void {
    const previous = this.state;
    this.state = {
      ...this.state,
      ...partial,
    };
    if (shouldPersist(previous, this.state, partial)) {
      this.schedulePersist();
    }
    for (const listener of this.listeners) {
      listener();
    }
  }

  private schedulePersist(): void {
    if (typeof window === "undefined") {
      persistUIState(this.state);
      return;
    }

    if (this.persistTimer !== undefined) {
      window.clearTimeout(this.persistTimer);
    }

    this.persistTimer = window.setTimeout(() => {
      this.persistTimer = undefined;
      persistUIState(this.state);
    }, 120);
  }
}

export const appStore = new AppStore();

export function useAppState(): AppState {
  return useSyncExternalStore(appStore.subscribe, appStore.getState, appStore.getState);
}

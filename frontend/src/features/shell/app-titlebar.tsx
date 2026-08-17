import { ArrowDownToLine, FolderOpen, Pause, Play, Settings } from "lucide-react";
import type { AppSnapshot } from "@/types/contracts";
import { appStore } from "@/lib/store/app-store";

type Props = {
  version: AppSnapshot["version"];
  health: AppSnapshot["health"];
};

export function AppTitlebar({ version, health }: Props) {
  return (
    <header className="titlebar">
      <div className="t-id">
        <span className="brand-mark" aria-hidden="true">
          <ArrowDownToLine size={18} strokeWidth={2.2} />
        </span>
        <div className="t-name">
          <strong>GoBarryGo</strong>
          <span>v{version.number || "—"} · {version.codename || "Starting"}</span>
        </div>
      </div>

      <div
        className="t-st"
        data-ready={health.ready}
        title={health.ready ? `Local aria2 RPC on port ${health.rpcPort}` : health.message}
      >
        <span aria-hidden="true" />
        {health.ready ? "Engine ready" : "Engine setup needed"}
      </div>

      <div className="t-spacer" />

      <nav className="t-actions" aria-label="Global download actions">
        <button type="button" className="tool" onClick={() => void appStore.pauseAll()} aria-label="Pause all downloads" title="Pause all downloads">
          <Pause size={15} />
          <span>Pause all</span>
        </button>
        <button type="button" className="tool" onClick={() => void appStore.resumeAll()} aria-label="Resume all downloads" title="Resume all downloads">
          <Play size={15} />
          <span>Resume all</span>
        </button>
        <button type="button" className="tool" onClick={() => void appStore.openDownloadDirectory()} aria-label="Open default download folder" title="Open default download folder">
          <FolderOpen size={15} />
          <span>Folder</span>
        </button>
        <button type="button" className="tool" onClick={() => appStore.openPreferences()} aria-label="Preferences" title="Preferences">
          <Settings size={15} />
          <span>Settings</span>
        </button>
      </nav>
    </header>
  );
}

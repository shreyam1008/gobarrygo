import { memo, type KeyboardEvent, type ReactNode } from "react";
import { FileDown, FolderOpen, Pause, Play, RotateCcw, Trash2 } from "lucide-react";
import type { DownloadItem } from "@/types/contracts";
import { formatBytes, formatETA, formatPercent, formatSpeed, formatStatus } from "@/lib/format";
import { StatusPill } from "@/features/downloads/status-pill";
import { appStore } from "@/lib/store/app-store";

type Props = {
  item: DownloadItem;
  selected: boolean;
  onSelect: (gid: string) => void;
};

export const DownloadRow = memo(function DownloadRow({ item, selected, onSelect }: Props) {
  const canPause = item.status === "active" || item.status === "waiting";
  const canResume = item.status === "paused";
  const canRetry = item.status === "error" || item.status === "removed";
  const canOpen = item.status === "complete";
  const progress = Math.max(0, Math.min(item.progress, 100));

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(item.gid);
    }
  };

  return (
    <article
      className={`download-row ${selected ? "download-row--selected" : ""}`}
      aria-selected={selected}
      tabIndex={0}
      onClick={() => onSelect(item.gid)}
      onDoubleClick={() => {
        if (canOpen) {
          void appStore.openDownloadedFile(item.gid);
        }
      }}
      onKeyDown={handleKeyDown}
    >
      <div className="download-row__file">
        <div className="download-row__title-line">
          <strong title={item.name}>{item.name || "Unnamed download"}</strong>
          <StatusPill status={item.status} />
        </div>
        <span className="download-row__subtle">{formatStatus(item.status)} · {item.connections} connections</span>
      </div>

      <div className="download-row__progress-cell">
        <div
          className="download-row__progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          aria-label={`${item.name} progress`}
        >
          <span style={{ transform: `scaleX(${Math.max(progress, 0.8) / 100})` }} />
        </div>
        <div className="download-row__progress-meta">
          <strong>{formatPercent(progress)}</strong>
          <span>{formatBytes(item.completedLength)} / {formatBytes(item.totalLength)}</span>
        </div>
      </div>

      <div className="download-row__transfer">
        <strong>{formatSpeed(item.downloadSpeed)}</strong>
        <span>{formatRowETA(item)}</span>
      </div>

      <div className="download-row__folder" title={item.directory}>
        {item.directory}
      </div>

      <div className="download-row__actions">
        {canPause ? (
          <ActionIcon label="Pause" onClick={() => appStore.pauseDownload(item.gid)}>
            <Pause size={15} />
          </ActionIcon>
        ) : null}
        {canResume ? (
          <ActionIcon label="Resume" onClick={() => appStore.resumeDownload(item.gid)}>
            <Play size={15} />
          </ActionIcon>
        ) : null}
        {canRetry ? (
          <ActionIcon label="Retry" onClick={() => appStore.retryDownload(item.gid)}>
            <RotateCcw size={15} />
          </ActionIcon>
        ) : null}
        {canOpen ? (
          <>
            <ActionIcon label="Open file" onClick={() => appStore.openDownloadedFile(item.gid)}>
              <FileDown size={15} />
            </ActionIcon>
            <ActionIcon label="Show folder" onClick={() => appStore.openDownloadFolder(item.gid)}>
              <FolderOpen size={15} />
            </ActionIcon>
          </>
        ) : null}
        <ActionIcon
          label="Remove from list"
          onClick={() => {
            if (window.confirm(`Remove "${item.name}" from the list? Files remain on disk.`)) {
              void appStore.removeDownload(item.gid, false);
            }
          }}
        >
          <Trash2 size={15} />
        </ActionIcon>
      </div>
    </article>
  );
});

type ActionIconProps = {
  label: string;
  onClick: () => void;
  children: ReactNode;
};

function ActionIcon({ label, onClick, children }: ActionIconProps) {
  return (
    <button
      type="button"
      className="icon-button"
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.stopPropagation();
        void onClick();
      }}
    >
      {children}
    </button>
  );
}

function formatRowETA(item: DownloadItem): string {
  if (item.status === "complete") {
    return "Done";
  }
  if (item.status === "paused") {
    return "Paused";
  }
  if (item.status === "waiting") {
    return "Queued";
  }
  if (item.status === "error") {
    return "Needs attention";
  }
  if (item.status === "removed") {
    return "Removed";
  }
  return formatETA(item.etaSeconds);
}

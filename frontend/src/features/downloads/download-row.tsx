import { memo, type KeyboardEvent, type ReactNode } from "react";
import { File, FileDown, FolderOpen, Globe2, Pause, Play, RotateCcw, Trash2 } from "lucide-react";
import { StatusPill } from "@/features/downloads/status-pill";
import { getDownloadSourceHost } from "@/lib/download-model";
import { formatBytes, formatETA, formatPercent, formatSpeed, formatStatus } from "@/lib/format";
import { appStore } from "@/lib/store/app-store";
import type { DownloadItem } from "@/types/contracts";

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
  const sourceHost = getDownloadSourceHost(item);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) {
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(item.gid);
    }
  };

  return (
    <article
      className={`dl-row ${selected ? "dl-selected" : ""}`}
      data-st={item.status}
      data-download-gid={item.gid}
      role="listitem"
      aria-current={selected ? "true" : undefined}
      tabIndex={0}
      onClick={() => onSelect(item.gid)}
      onDoubleClick={() => {
        if (canOpen) {
          void appStore.openDownloadedFile(item.gid);
        }
      }}
      onKeyDown={handleKeyDown}
    >
      <div className="col-file dl-file">
        <File className="dl-icon" size={18} aria-hidden="true" />
        <div>
          <strong title={item.name}>{item.name || "Unnamed download"}</strong>
          <span className="dl-meta">
            <span className="c-source">{sourceHost} · </span>
            {item.connections} connection{item.connections === 1 ? "" : "s"}
            <span className="c-transfer"> · {formatSpeed(item.downloadSpeed)} · {formatRowETA(item)}</span>
          </span>
        </div>
        <span className="c-st"><StatusPill status={item.status} /></span>
      </div>

      <div className="col-source dl-source" title={sourceHost}>
        <Globe2 size={14} aria-hidden="true" />
        <span>{sourceHost}</span>
      </div>

      <div className="col-progress dl-progress-cell">
        <div
          className="progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          aria-label={`${item.name} progress`}
        >
          <span style={{ transform: `scaleX(${progress / 100})` }} />
        </div>
        <div className="progress-meta">
          <strong>{formatPercent(progress)}</strong>
          <span className="c-size">{formatBytes(item.completedLength)} / {formatBytes(item.totalLength)}</span>
        </div>
      </div>

      <strong className="col-speed dl-speed">{formatSpeed(item.downloadSpeed)}</strong>
      <span className="col-eta dl-eta">{formatRowETA(item)}</span>
      <span className="col-size dl-size">{formatBytes(item.completedLength)} / {formatBytes(item.totalLength)}</span>
      <span className="col-st dl-st"><StatusPill status={item.status} /></span>

      <div className="col-actions dl-actions">
        {canPause ? (
          <ActionIcon label="Pause" onClick={() => appStore.pauseDownload(item.gid)}>
            <Pause size={14} />
          </ActionIcon>
        ) : null}
        {canResume ? (
          <ActionIcon label="Resume" onClick={() => appStore.resumeDownload(item.gid)}>
            <Play size={14} />
          </ActionIcon>
        ) : null}
        {canRetry ? (
          <ActionIcon label="Retry" onClick={() => appStore.retryDownload(item.gid)}>
            <RotateCcw size={14} />
          </ActionIcon>
        ) : null}
        {canOpen ? (
          <>
            <ActionIcon label="Open file" onClick={() => appStore.openDownloadedFile(item.gid)}>
              <FileDown size={14} />
            </ActionIcon>
            <ActionIcon label="Show folder" onClick={() => appStore.openDownloadFolder(item.gid)}>
              <FolderOpen size={14} />
            </ActionIcon>
          </>
        ) : null}
        <ActionIcon
          label="Remove from list"
          onClick={() => {
            if (window.confirm(`Remove "${item.name}" from the list? Files remain on disk.`)) {
              return appStore.removeDownload(item.gid, false);
            }
          }}
        >
          <Trash2 size={14} />
        </ActionIcon>
      </div>
    </article>
  );
});

function ActionIcon({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void | Promise<void>;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="icon row-action"
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
    return "Attention";
  }
  if (item.status === "removed") {
    return "Removed";
  }
  return item.etaSeconds > 0 ? formatETA(item.etaSeconds) : formatStatus(item.status);
}

import type { ReactNode } from "react";
import type { DownloadItem } from "@bindings/github.com/shreyam1008/gobarrygo/internal/contracts/models.js";
import { Pause, Play, RotateCcw, Trash2, FolderOpen, FileDown } from "lucide-react";
import { formatBytes, formatETA, formatPercent, formatSpeed } from "@/lib/format";
import { StatusPill } from "@/features/downloads/status-pill";
import { appStore } from "@/lib/store/app-store";

type Props = {
  item: DownloadItem;
  selected: boolean;
  onSelect: (gid: string) => void;
};

export function DownloadRow({ item, selected, onSelect }: Props) {
  const canPause = item.status === "active" || item.status === "waiting";
  const canResume = item.status === "paused";
  const canRetry = item.status === "error" || item.status === "removed";
  const canOpen = item.status === "complete";

  return (
    <button
      type="button"
      className={`download-row ${selected ? "download-row--selected" : ""}`}
      onClick={() => onSelect(item.gid)}
    >
      <div className="download-row__summary">
        <div className="download-row__title-line">
          <strong>{item.name}</strong>
          <StatusPill status={item.status} />
        </div>
        <div className="download-row__meta">
          <span>{formatBytes(item.completedLength)} of {formatBytes(item.totalLength)}</span>
          <span>{formatSpeed(item.downloadSpeed)}</span>
          <span>{formatETA(item.etaSeconds)}</span>
        </div>
        <div className="download-row__progress">
          <span style={{ width: `${Math.max(item.progress, 2)}%` }} />
        </div>
      </div>

      <div className="download-row__tail">
        <span className="download-row__percent">{formatPercent(item.progress)}</span>
        <div className="download-row__actions">
          {canPause ? (
            <ActionIcon label="Pause" onClick={() => appStore.pauseDownload(item.gid)}>
              <Pause size={16} />
            </ActionIcon>
          ) : null}
          {canResume ? (
            <ActionIcon label="Resume" onClick={() => appStore.resumeDownload(item.gid)}>
              <Play size={16} />
            </ActionIcon>
          ) : null}
          {canRetry ? (
            <ActionIcon label="Retry" onClick={() => appStore.retryDownload(item.gid)}>
              <RotateCcw size={16} />
            </ActionIcon>
          ) : null}
          {canOpen ? (
            <>
              <ActionIcon label="Open file" onClick={() => appStore.openDownloadedFile(item.gid)}>
                <FileDown size={16} />
              </ActionIcon>
              <ActionIcon label="Show folder" onClick={() => appStore.openDownloadFolder(item.gid)}>
                <FolderOpen size={16} />
              </ActionIcon>
            </>
          ) : null}
          <ActionIcon
            label="Remove"
            onClick={() => appStore.removeDownload(item.gid, false)}
          >
            <Trash2 size={16} />
          </ActionIcon>
        </div>
      </div>
    </button>
  );
}

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
      onClick={(event) => {
        event.stopPropagation();
        void onClick();
      }}
    >
      {children}
    </button>
  );
}

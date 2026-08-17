import { memo } from "react";
import {
  File,
  FileDown,
  FolderOpen,
  PanelRightClose,
  Pause,
  Play,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { StatusPill } from "@/features/downloads/status-pill";
import { getDownloadSourceHost } from "@/lib/download-model";
import { formatBytes, formatETA, formatPercent, formatSpeed, formatStatus } from "@/lib/format";
import { appStore } from "@/lib/store/app-store";
import type { DownloadItem } from "@/types/contracts";

type Props = {
  item: DownloadItem | undefined;
  onClose: () => void;
};

export const InspectorPanel = memo(function InspectorPanel({ item, onClose }: Props) {
  if (!item) {
    return (
      <aside className="inspect inspect--empty" aria-label="Download inspector">
        <InspectorTitle onClose={onClose} />
        <div className="i-empty">
          <File size={22} />
          <strong>No download selected</strong>
          <p>Select a queue row to inspect its files, source, and transfer details.</p>
        </div>
      </aside>
    );
  }

  const canPause = item.status === "active" || item.status === "waiting";
  const canResume = item.status === "paused";
  const canRetry = item.status === "error" || item.status === "removed";
  const canOpen = item.status === "complete";
  const progress = Math.max(0, Math.min(item.progress, 100));
  const sourceHost = getDownloadSourceHost(item);

  return (
    <aside className="inspect" aria-label={`Inspector for ${item.name}`}>
      <InspectorTitle onClose={onClose} />

      <div className="i-file">
        <File size={20} aria-hidden="true" />
        <div>
          <h3 title={item.name}>{item.name || "Unnamed download"}</h3>
          <StatusPill status={item.status} />
        </div>
      </div>

      <div className="i-actions">
        {canOpen ? (
          <button type="button" className="tool primary" onClick={() => void appStore.openDownloadedFile(item.gid)}>
            <FileDown size={15} /> Open
          </button>
        ) : null}
        <button type="button" className="tool" onClick={() => void appStore.openDownloadFolder(item.gid)}>
          <FolderOpen size={15} /> Folder
        </button>
        {canPause ? (
          <button type="button" className="tool" onClick={() => void appStore.pauseDownload(item.gid)}>
            <Pause size={15} /> Pause
          </button>
        ) : null}
        {canResume ? (
          <button type="button" className="tool" onClick={() => void appStore.resumeDownload(item.gid)}>
            <Play size={15} /> Resume
          </button>
        ) : null}
        {canRetry ? (
          <button type="button" className="tool" onClick={() => void appStore.retryDownload(item.gid)}>
            <RotateCcw size={15} /> Retry
          </button>
        ) : null}
        <button
          type="button"
          className="tool danger"
          onClick={() => {
            if (window.confirm(`Delete files for "${item.name}" and remove the download?`)) {
              void appStore.removeDownload(item.gid, true);
            }
          }}
        >
          <Trash2 size={15} /> Delete
        </button>
      </div>

      <section className="i-sec inspect-progress">
        <div className="i-head">
          <h4>Progress</h4>
          <strong>{formatPercent(progress)}</strong>
        </div>
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
        <dl className="i-data">
          <Detail label="Downloaded" value={`${formatBytes(item.completedLength)} of ${formatBytes(item.totalLength)}`} />
          <Detail label="Speed" value={formatSpeed(item.downloadSpeed)} />
          <Detail label="Upload" value={formatSpeed(item.uploadSpeed)} />
          <Detail label="ETA" value={formatInspectorETA(item)} />
          <Detail label="Connections" value={String(item.connections)} />
        </dl>
      </section>

      <section className="i-sec">
        <h4>Destination</h4>
        <div className="i-dest">
          <span title={item.directory}>{item.directory || "Default download folder"}</span>
          <button type="button" className="bare" onClick={() => void appStore.openDownloadFolder(item.gid)} aria-label="Show destination folder" title="Show destination folder">
            <FolderOpen size={15} />
          </button>
        </div>
      </section>

      {item.errorMessage ? (
        <section className="i-sec inspect-error">
          <h4>Error {item.errorCode ? `#${item.errorCode}` : ""}</h4>
          <p>{item.errorMessage}</p>
        </section>
      ) : null}

      <section className="i-sec">
        <h4>Transfer</h4>
        <dl className="i-data">
          <Detail label="GID" value={item.gid} />
          <Detail label="Status" value={formatStatus(item.status)} />
          <Detail label="Source" value={sourceHost} />
          <Detail label="File size" value={formatBytes(item.totalLength)} />
        </dl>
      </section>

      <section className="i-sec i-files">
        <h4>Files ({item.files.length})</h4>
        <ul className="file-list">
          {item.files.length === 0 ? (
            <li className="file-list__empty">No file metadata yet.</li>
          ) : item.files.map((file) => (
            <li key={`${item.gid}-${file.index}`}>
              <File size={15} aria-hidden="true" />
              <div>
                <strong title={file.path}>{file.path || `File ${file.index + 1}`}</strong>
                <span>{formatBytes(file.completedLength)} / {formatBytes(file.length)}</span>
              </div>
              <small title={file.uris.join("\n")}>
                {file.selected ? "Selected" : "Skipped"}
                {file.uris.length > 0 ? ` · ${file.uris.length} source${file.uris.length === 1 ? "" : "s"}` : ""}
              </small>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
});

function InspectorTitle({ onClose }: { onClose: () => void }) {
  return (
    <header className="i-title">
      <h2>Inspector</h2>
      <button type="button" className="bare i-close" onClick={onClose} aria-label="Close details" title="Close details">
        <PanelRightClose size={16} />
      </button>
    </header>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd title={value}>{value}</dd>
    </div>
  );
}

function formatInspectorETA(item: DownloadItem): string {
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
  return item.etaSeconds > 0 ? formatETA(item.etaSeconds) : "Ready";
}

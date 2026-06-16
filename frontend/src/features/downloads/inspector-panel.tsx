import { memo } from "react";
import { FileDown, FolderOpen, Pause, Play, RotateCcw, Trash2 } from "lucide-react";
import type { DownloadItem } from "@/types/contracts";
import { formatBytes, formatETA, formatPercent, formatSpeed, formatStatus } from "@/lib/format";
import { appStore } from "@/lib/store/app-store";

type Props = {
  item: DownloadItem | undefined;
};

export const InspectorPanel = memo(function InspectorPanel({ item }: Props) {
  if (!item) {
    return (
      <aside className="inspector-panel inspector-panel--empty">
        <h2>Inspector</h2>
        <p>Select a download to inspect paths, files, errors, and transfer details.</p>
      </aside>
    );
  }

  const canPause = item.status === "active" || item.status === "waiting";
  const canResume = item.status === "paused";
  const canRetry = item.status === "error" || item.status === "removed";
  const canOpen = item.status === "complete";

  return (
    <aside className="inspector-panel">
      <header className="inspector-panel__header">
        <div>
          <span className="inspector-panel__eyebrow">{formatStatus(item.status)}</span>
          <h2 title={item.name}>{item.name || "Unnamed download"}</h2>
        </div>
      </header>

      <div className="inspector-actions">
        {canOpen ? (
          <button type="button" className="tool-button tool-button--primary" onClick={() => void appStore.openDownloadedFile(item.gid)}>
            <FileDown size={16} />
            Open
          </button>
        ) : null}
        <button type="button" className="tool-button" onClick={() => void appStore.openDownloadFolder(item.gid)}>
          <FolderOpen size={16} />
          Folder
        </button>
        {canPause ? (
          <button type="button" className="tool-button" onClick={() => void appStore.pauseDownload(item.gid)}>
            <Pause size={16} />
            Pause
          </button>
        ) : null}
        {canResume ? (
          <button type="button" className="tool-button" onClick={() => void appStore.resumeDownload(item.gid)}>
            <Play size={16} />
            Resume
          </button>
        ) : null}
        {canRetry ? (
          <button type="button" className="tool-button" onClick={() => void appStore.retryDownload(item.gid)}>
            <RotateCcw size={16} />
            Retry
          </button>
        ) : null}
        <button
          type="button"
          className="tool-button tool-button--danger"
          onClick={() => {
            if (window.confirm(`Delete files for "${item.name}" and remove the download?`)) {
              void appStore.removeDownload(item.gid, true);
            }
          }}
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>

      <div className="inspector-progress">
        <div
          className="download-row__progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(item.progress)}
          aria-label={`${item.name} progress`}
        >
          <span style={{ transform: `scaleX(${Math.max(item.progress, 0.8) / 100})` }} />
        </div>
        <strong>{formatPercent(item.progress)}</strong>
      </div>

      <dl className="inspector-panel__grid">
        <Detail label="Downloaded" value={formatBytes(item.completedLength)} />
        <Detail label="Total size" value={formatBytes(item.totalLength)} />
        <Detail label="Down speed" value={formatSpeed(item.downloadSpeed)} />
        <Detail label="Up speed" value={formatSpeed(item.uploadSpeed)} />
        <Detail label="ETA" value={formatInspectorETA(item)} />
        <Detail label="Connections" value={String(item.connections)} />
      </dl>

      <section className="inspector-section">
        <h3>Destination</h3>
        <p title={item.directory}>{item.directory}</p>
      </section>

      {item.errorMessage ? (
        <section className="inspector-section inspector-section--error">
          <h3>Error {item.errorCode ? `#${item.errorCode}` : ""}</h3>
          <p>{item.errorMessage}</p>
        </section>
      ) : null}

      <section className="inspector-section">
        <h3>Files</h3>
        <ul className="file-list">
          {item.files.length === 0 ? (
            <li>No file metadata yet.</li>
          ) : item.files.map((file) => (
            <li key={`${item.gid}-${file.index}`}>
              <div>
                <strong title={file.path}>{file.path || `File ${file.index + 1}`}</strong>
                <span>{formatBytes(file.completedLength)} / {formatBytes(file.length)}</span>
              </div>
              {file.uris.length > 0 ? (
                <small title={file.uris.join("\n")}>{file.uris.length} source{file.uris.length === 1 ? "" : "s"}</small>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
});

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail">
      <dt>{label}</dt>
      <dd>{value}</dd>
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
  return formatETA(item.etaSeconds);
}

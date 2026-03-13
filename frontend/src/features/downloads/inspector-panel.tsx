import type { DownloadItem } from "@bindings/github.com/shreyam1008/gobarrygo/internal/contracts/models.js";
import { formatBytes, formatETA, formatPercent, formatSpeed } from "@/lib/format";

type Props = {
  item: DownloadItem | undefined;
};

export function InspectorPanel({ item }: Props) {
  if (!item) {
    return (
      <aside className="inspector-panel">
        <h3>Inspector</h3>
        <p>Select a download to inspect file paths, throughput, and errors.</p>
      </aside>
    );
  }

  return (
    <aside className="inspector-panel">
      <h3>{item.name}</h3>
      <dl className="inspector-panel__grid">
        <Detail label="Status" value={item.status} />
        <Detail label="Progress" value={formatPercent(item.progress)} />
        <Detail label="Downloaded" value={formatBytes(item.completedLength)} />
        <Detail label="Total size" value={formatBytes(item.totalLength)} />
        <Detail label="Speed" value={formatSpeed(item.downloadSpeed)} />
        <Detail label="ETA" value={formatETA(item.etaSeconds)} />
        <Detail label="Connections" value={String(item.connections)} />
        <Detail label="Folder" value={item.directory} />
      </dl>

      {item.errorMessage ? (
        <div className="inspector-panel__error">
          <strong>Error</strong>
          <p>{item.errorMessage}</p>
        </div>
      ) : null}

      <div className="inspector-panel__files">
        <strong>Files</strong>
        <ul>
          {item.files.map((file) => (
            <li key={`${item.gid}-${file.index}`}>
              <span>{file.path}</span>
              <small>{formatBytes(file.completedLength)} / {formatBytes(file.length)}</small>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}


import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  Folder,
  Info,
  ListChecks,
  Pause,
  type LucideIcon,
} from "lucide-react";
import type { DownloadStatusCounts } from "@/lib/download-model";
import { appStore } from "@/lib/store/app-store";
import type { DownloadFilter, DownloadItem } from "@/types/contracts";

const filters: Array<{ key: DownloadFilter; label: string; icon: LucideIcon }> = [
  { key: "all", label: "All", icon: Download },
  { key: "active", label: "Active", icon: Activity },
  { key: "waiting", label: "Queued", icon: Clock3 },
  { key: "paused", label: "Paused", icon: Pause },
  { key: "complete", label: "Done", icon: CheckCircle2 },
  { key: "error", label: "Issues", icon: AlertTriangle },
];

type Props = {
  currentFilter: DownloadFilter;
  downloads: DownloadItem[];
  counts: DownloadStatusCounts;
  directoryOptions: string[];
  quickDirectory: string;
};

export function NavigationRail({
  currentFilter,
  downloads,
  counts,
  directoryOptions,
  quickDirectory,
}: Props) {
  return (
    <aside className="nav-rail" aria-label="Download navigation">
      <section className="rail-sec rail-sec--filters">
        <h2><ListChecks size={15} /> Downloads</h2>
        <div className="filter-list">
          {filters.map(({ key, label, icon: Icon }) => {
            const count = key === "all" ? downloads.length : counts[key] ?? 0;
            return (
              <button
                key={key}
                type="button"
                className={`filter ${currentFilter === key ? "filter-on" : ""}`}
                aria-current={currentFilter === key ? "page" : undefined}
                onClick={() => appStore.setFilter(key)}
              >
                <Icon size={16} aria-hidden="true" />
                <span>{label}</span>
                <strong>{count}</strong>
              </button>
            );
          })}
        </div>
      </section>

      {directoryOptions.length > 0 ? (
        <section className="rail-sec rail-folders">
          <h2><Folder size={15} /> Recent download folders</h2>
          <div className="location-list">
            {directoryOptions.slice(0, 6).map((directory) => (
              <button
                key={directory}
                type="button"
                className={`loc ${quickDirectory === directory ? "loc--active" : ""}`}
                onClick={() => appStore.setQuickDirectory(directory)}
                title={`Use ${directory} for quick add`}
              >
                <Folder size={15} aria-hidden="true" />
                <span>
                  <strong>{directoryLabel(directory)}</strong>
                  <small>{directory}</small>
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <details className="about">
        <summary><Info size={15} /> About GoBarryGo</summary>
        <div className="about-links">
          <ProjectLink label="Project site" url="https://gobarrygo.shreyam1008.com.np/" />
          <ProjectLink label="GitHub repository" url="https://github.com/shreyam1008/gobarrygo" />
          <ProjectLink label="@shreyam1008" url="https://github.com/shreyam1008" />
          <ProjectLink label="shreyam1008.com.np" url="https://shreyam1008.com.np" />
        </div>
      </details>
    </aside>
  );
}

function ProjectLink({ label, url }: { label: string; url: string }) {
  return (
    <button type="button" onClick={() => void appStore.openWebsite(url)}>
      <span>{label}</span>
      <ExternalLink size={13} aria-hidden="true" />
    </button>
  );
}

function directoryLabel(directory: string): string {
  const normalized = directory.replace(/[\\/]+$/, "");
  const parts = normalized.split(/[\\/]/);
  return parts.at(-1) || directory;
}

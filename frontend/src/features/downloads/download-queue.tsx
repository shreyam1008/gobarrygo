import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Download,
  Network,
  PanelRightOpen,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { DownloadRow } from "@/features/downloads/download-row";
import type { DownloadDashboard } from "@/lib/download-model";
import { formatBytes, formatETA, formatSpeed } from "@/lib/format";
import { appStore } from "@/lib/store/app-store";
import type { AppSnapshot, DownloadItem } from "@/types/contracts";

const rowHeight = 64;
const rowOverscan = 8;

type Props = {
  dashboard: DownloadDashboard;
  metrics: AppSnapshot["metrics"];
  peakDownloadSpeed: number;
  loading: boolean;
  search: string;
  searchRef: RefObject<HTMLInputElement | null>;
  selectedGID: string | null;
  onShowDetails: () => void;
};

export function DownloadQueue({
  dashboard,
  metrics,
  peakDownloadSpeed,
  loading,
  search,
  searchRef,
  selectedGID,
  onShowDetails,
}: Props) {
  return (
    <section className="queue" aria-label="Downloads">
      <div className="qbar">
        <div className="qbar-title">
          <h1>Queue</h1>
          <span>{dashboard.filteredDownloads.length === metrics.totalCount
            ? `${metrics.totalCount} download${metrics.totalCount === 1 ? "" : "s"}`
            : `${dashboard.filteredDownloads.length} of ${metrics.totalCount}`}</span>
        </div>
        <div className="qbar-tools">
          <label className="search">
            <Search size={15} aria-hidden="true" />
            <span className="sr-only">Search downloads</span>
            <input
              ref={searchRef}
              type="search"
              placeholder="Search queue"
              value={search}
              onChange={(event) => appStore.setSearch(event.target.value)}
            />
            {search ? (
              <button type="button" onClick={() => appStore.clearSearch()} aria-label="Clear search" title="Clear search">
                <X size={14} />
              </button>
            ) : null}
          </label>
          <button type="button" className="icon" onClick={() => void appStore.refresh()} aria-label="Refresh downloads" title="Refresh">
            <RefreshCcw size={15} />
          </button>
          <button
            type="button"
            className="tool qbar-details"
            disabled={!selectedGID}
            onClick={onShowDetails}
          >
            <PanelRightOpen size={15} />
            Details
          </button>
        </div>
      </div>

      <div className="qhead" aria-hidden="true">
        <span className="col-file">Filename</span>
        <span className="col-source">Source</span>
        <span className="col-progress">Progress</span>
        <span className="col-speed">Speed</span>
        <span className="col-eta">ETA</span>
        <span className="col-size">Transferred / size</span>
        <span className="col-st">Status</span>
        <span className="col-actions">Actions</span>
      </div>

      <VirtualDownloadList
        downloads={dashboard.filteredDownloads}
        loading={loading}
        selectedGID={selectedGID}
        onSelect={(gid) => appStore.setSelectedGID(gid)}
      />

      <footer className="qfoot" aria-label="Queue metrics">
        <span><Download size={14} /> {metrics.totalCount} downloads</span>
        <span><Network size={14} /> {metrics.activeCount} active · {dashboard.connectionCount} connections</span>
        <span title={`Peak ${formatSpeed(peakDownloadSpeed)}`}><ArrowDown size={14} /> {formatSpeed(metrics.downloadSpeed)}</span>
        <span><ArrowUp size={14} /> {formatSpeed(metrics.uploadSpeed || dashboard.totalUploadSpeed)}</span>
        {dashboard.issueCount > 0 ? (
          <span className="qfoot-issues"><AlertTriangle size={14} /> {dashboard.issueCount} issue{dashboard.issueCount === 1 ? "" : "s"}</span>
        ) : null}
        <span className="qfoot-remaining">
          {dashboard.activeBytesRemaining > 0
            ? `${formatBytes(dashboard.activeBytesRemaining)} left · ${formatMetricETA(dashboard.activeETASeconds)}`
            : "No active backlog"}
        </span>
      </footer>
    </section>
  );
}

const VirtualDownloadList = memo(function VirtualDownloadList({
  downloads,
  loading,
  selectedGID,
  onSelect,
}: {
  downloads: DownloadItem[];
  loading: boolean;
  selectedGID: string | null;
  onSelect: (gid: string) => void;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [viewport, setViewport] = useState({ height: 520, scrollTop: 0 });

  const measure = useCallback(() => {
    if (animationFrameRef.current !== null) {
      return;
    }

    animationFrameRef.current = window.requestAnimationFrame(() => {
      animationFrameRef.current = null;
      const node = viewportRef.current;
      if (!node) {
        return;
      }
      setViewport({ height: node.clientHeight || 520, scrollTop: node.scrollTop });
    });
  }, []);

  const measureNow = useCallback(() => {
    const node = viewportRef.current;
    if (!node) {
      return;
    }
    setViewport({ height: node.clientHeight || 520, scrollTop: node.scrollTop });
  }, []);

  useEffect(() => {
    measureNow();
    const node = viewportRef.current;
    if (!node || typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(measureNow);
    observer.observe(node);
    return () => {
      observer.disconnect();
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [measureNow]);

  const start = Math.max(0, Math.floor(viewport.scrollTop / rowHeight) - rowOverscan);
  const visibleCount = Math.ceil(viewport.height / rowHeight) + rowOverscan * 2;
  const end = Math.min(downloads.length, start + visibleCount);
  const visibleDownloads = downloads.slice(start, end);

  if (loading) {
    return (
      <div className="q-empty">
        <SlidersHorizontal size={18} />
        <span>Starting the download engine.</span>
      </div>
    );
  }

  if (downloads.length === 0) {
    return (
      <div className="q-empty">
        <Download size={18} />
        <span>No downloads match this view.</span>
      </div>
    );
  }

  return (
    <div
      ref={viewportRef}
      className="dl-list"
      role="list"
      aria-label="Download queue"
      onScroll={measure}
      data-rendered={`${visibleDownloads.length}/${downloads.length}`}
    >
      <div className="dl-spacer" style={{ height: downloads.length * rowHeight }}>
        <div className="dl-window" style={{ transform: `translateY(${start * rowHeight}px)` }}>
          {visibleDownloads.map((item) => (
            <div key={item.gid} className="dl-slot">
              <DownloadRow item={item} selected={selectedGID === item.gid} onSelect={onSelect} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

function formatMetricETA(seconds: number): string {
  return seconds > 0 ? formatETA(seconds) : "Idle";
}

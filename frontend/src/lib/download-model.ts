import type { DownloadFilter, DownloadItem } from "@/types/contracts";

const knownStatuses = ["active", "waiting", "paused", "complete", "error", "removed"] as const;
const downloadURLPattern = /^(?:https?:\/\/|magnet:|(?:s?ftp|ftps):\/\/)/i;

export type DownloadStatusCounts = Record<string, number>;

export type DownloadDirectorySummary = {
  directory: string;
  count: number;
  totalBytes: number;
  completedBytes: number;
  activeBytesRemaining: number;
  lastSeenIndex: number;
};

export type DownloadDashboard = {
  filteredDownloads: DownloadItem[];
  counts: DownloadStatusCounts;
  totalSpeed: number;
  totalBytes: number;
  completedBytes: number;
  activeBytesRemaining: number;
  topDirectories: DownloadDirectorySummary[];
  recentDirectories: DownloadDirectorySummary[];
};

export function parseDownloadURLs(text: string): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];

  for (const part of text.split(/\s+/)) {
    const candidate = part.trim();
    if (!candidate || !downloadURLPattern.test(candidate) || seen.has(candidate)) {
      continue;
    }

    seen.add(candidate);
    urls.push(candidate);
  }

  return urls;
}

export function buildDownloadDashboard(
  downloads: DownloadItem[],
  filter: DownloadFilter,
  search: string,
): DownloadDashboard {
  const counts = createStatusCounts();
  const directories = new Map<string, DownloadDirectorySummary>();
  const query = search.trim().toLowerCase();
  const filteredDownloads: DownloadItem[] = [];
  let totalSpeed = 0;
  let totalBytes = 0;
  let completedBytes = 0;
  let activeBytesRemaining = 0;

  for (let index = 0; index < downloads.length; index += 1) {
    const item = downloads[index];
    const itemTotalBytes = nonNegativeNumber(item.totalLength);
    const itemCompletedBytes = nonNegativeNumber(item.completedLength);
    const itemRemainingBytes = Math.max(itemTotalBytes - itemCompletedBytes, 0);

    counts[item.status] = (counts[item.status] ?? 0) + 1;
    totalSpeed += nonNegativeNumber(item.downloadSpeed);
    totalBytes += itemTotalBytes;
    completedBytes += itemCompletedBytes;

    if (item.status === "active") {
      activeBytesRemaining += itemRemainingBytes;
    }

    addDirectorySummary(directories, item, index, itemTotalBytes, itemCompletedBytes, itemRemainingBytes);

    if (matchesFilter(item, filter) && matchesSearch(item, query)) {
      filteredDownloads.push(item);
    }
  }

  const directorySummaries = Array.from(directories.values());

  return {
    filteredDownloads,
    counts,
    totalSpeed,
    totalBytes,
    completedBytes,
    activeBytesRemaining,
    topDirectories: directorySummaries.slice().sort(compareTopDirectories),
    recentDirectories: directorySummaries.slice().sort(compareRecentDirectories),
  };
}

function createStatusCounts(): DownloadStatusCounts {
  const counts: DownloadStatusCounts = {};
  for (const status of knownStatuses) {
    counts[status] = 0;
  }
  return counts;
}

function matchesFilter(item: DownloadItem, filter: DownloadFilter): boolean {
  return filter === "all" || item.status === filter;
}

function matchesSearch(item: DownloadItem, query: string): boolean {
  if (!query) {
    return true;
  }

  return (
    item.name.toLowerCase().includes(query) ||
    item.directory.toLowerCase().includes(query)
  );
}

function addDirectorySummary(
  directories: Map<string, DownloadDirectorySummary>,
  item: DownloadItem,
  index: number,
  totalBytes: number,
  completedBytes: number,
  remainingBytes: number,
): void {
  const directory = item.directory.trim();
  if (!directory) {
    return;
  }

  let summary = directories.get(directory);
  if (!summary) {
    summary = {
      directory,
      count: 0,
      totalBytes: 0,
      completedBytes: 0,
      activeBytesRemaining: 0,
      lastSeenIndex: index,
    };
    directories.set(directory, summary);
  }

  summary.count += 1;
  summary.totalBytes += totalBytes;
  summary.completedBytes += completedBytes;
  summary.lastSeenIndex = index;

  if (item.status === "active") {
    summary.activeBytesRemaining += remainingBytes;
  }
}

function compareTopDirectories(
  left: DownloadDirectorySummary,
  right: DownloadDirectorySummary,
): number {
  return (
    right.count - left.count ||
    right.totalBytes - left.totalBytes ||
    left.directory.localeCompare(right.directory)
  );
}

function compareRecentDirectories(
  left: DownloadDirectorySummary,
  right: DownloadDirectorySummary,
): number {
  return right.lastSeenIndex - left.lastSeenIndex || left.directory.localeCompare(right.directory);
}

function nonNegativeNumber(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return value;
}

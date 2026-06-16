import type { DownloadFilter, DownloadItem } from "@/types/contracts";

const knownStatuses = ["active", "waiting", "paused", "complete", "error", "removed"] as const;
const supportedProtocols = new Set(["http:", "https:", "ftp:", "ftps:", "sftp:"]);
const maybeURLPattern = /^[a-z][a-z0-9+.-]*:/i;

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
  totalUploadSpeed: number;
  totalBytes: number;
  completedBytes: number;
  totalRemainingBytes: number;
  activeBytesRemaining: number;
  activeETASeconds: number;
  connectionCount: number;
  issueCount: number;
  topDirectories: DownloadDirectorySummary[];
  recentDirectories: DownloadDirectorySummary[];
};

export type DownloadInputAnalysis = {
  urls: string[];
  duplicateCount: number;
  rejectedCount: number;
  tokenCount: number;
};

export function analyzeDownloadInput(text: string): DownloadInputAnalysis {
  const seen = new Set<string>();
  const urls: string[] = [];
  let duplicateCount = 0;
  let rejectedCount = 0;
  let tokenCount = 0;

  for (const part of text.split(/\s+/)) {
    const candidate = normalizeCandidateToken(part);
    if (!candidate) {
      continue;
    }

    if (!isSupportedDownloadURL(candidate)) {
      if (maybeURLPattern.test(candidate) || candidate.includes("://")) {
        rejectedCount += 1;
        tokenCount += 1;
      }
      continue;
    }

    tokenCount += 1;
    if (seen.has(candidate)) {
      duplicateCount += 1;
      continue;
    }
    seen.add(candidate);
    urls.push(candidate);
  }

  return {
    urls,
    duplicateCount,
    rejectedCount,
    tokenCount,
  };
}

export function parseDownloadURLs(text: string): string[] {
  return analyzeDownloadInput(text).urls;
}

function normalizeCandidateToken(value: string): string {
  return value
    .trim()
    .replace(/^[<([{'"`]+/, "")
    .replace(/[>\])}'"`,;.]+$/, "");
}

function isSupportedDownloadURL(value: string): boolean {
  if (/^magnet:\?/i.test(value)) {
    return true;
  }

  try {
    return supportedProtocols.has(new URL(value).protocol.toLowerCase());
  } catch {
    return false;
  }
}

export function describeDownloadInput(analysis: DownloadInputAnalysis): string {
  if (analysis.urls.length === 0 && analysis.tokenCount > 0) {
    return "No supported download links";
  }
  if (analysis.urls.length === 0) {
    return "";
  }

  const parts = [`${analysis.urls.length} link${analysis.urls.length === 1 ? "" : "s"} ready`];
  if (analysis.duplicateCount > 0) {
    parts.push(`${analysis.duplicateCount} duplicate${analysis.duplicateCount === 1 ? "" : "s"} skipped`);
  }
  if (analysis.rejectedCount > 0) {
    parts.push(`${analysis.rejectedCount} unsupported skipped`);
  }

  return parts.join(" · ");
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
  let totalUploadSpeed = 0;
  let totalBytes = 0;
  let completedBytes = 0;
  let totalRemainingBytes = 0;
  let activeBytesRemaining = 0;
  let connectionCount = 0;

  for (let index = 0; index < downloads.length; index += 1) {
    const item = downloads[index];
    const itemTotalBytes = nonNegativeNumber(item.totalLength);
    const itemCompletedBytes = nonNegativeNumber(item.completedLength);
    const itemRemainingBytes = Math.max(itemTotalBytes - itemCompletedBytes, 0);

    counts[item.status] = (counts[item.status] ?? 0) + 1;
    totalSpeed += nonNegativeNumber(item.downloadSpeed);
    totalUploadSpeed += nonNegativeNumber(item.uploadSpeed);
    totalBytes += itemTotalBytes;
    completedBytes += itemCompletedBytes;
    totalRemainingBytes += itemRemainingBytes;
    connectionCount += Math.max(0, item.connections);

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
    totalUploadSpeed,
    totalBytes,
    completedBytes,
    totalRemainingBytes,
    activeBytesRemaining,
    activeETASeconds: totalSpeed > 0 && activeBytesRemaining > 0
      ? Math.ceil(activeBytesRemaining / totalSpeed)
      : 0,
    connectionCount,
    issueCount: (counts.error ?? 0) + (counts.removed ?? 0),
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

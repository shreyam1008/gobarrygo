import { describe, expect, it } from "vitest";
import {
  buildDownloadDashboard,
  parseDownloadURLs,
  type DownloadDirectorySummary,
} from "@/lib/download-model";
import type { DownloadItem } from "@/types/contracts";

describe("parseDownloadURLs", () => {
  it("splits whitespace, filters supported URL schemes, and dedupes in order", () => {
    expect(
      parseDownloadURLs(`
        https://example.com/file.iso
        not-a-download
        http://mirror.example/file.iso
        magnet:?xt=urn:btih:abc123
        ftp://files.example/archive.zip
        ftps://secure.example/archive.zip
        sftp://server.example/archive.zip
        https://example.com/file.iso
        mailto:test@example.com
      `),
    ).toEqual([
      "https://example.com/file.iso",
      "http://mirror.example/file.iso",
      "magnet:?xt=urn:btih:abc123",
      "ftp://files.example/archive.zip",
      "ftps://secure.example/archive.zip",
      "sftp://server.example/archive.zip",
    ]);
  });

  it("returns an empty array for empty or unsupported input", () => {
    expect(parseDownloadURLs("  \n\t file.txt mailto:test@example.com ")).toEqual([]);
  });
});

describe("buildDownloadDashboard", () => {
  it("filters downloads while keeping counts and totals global", () => {
    const downloads = sampleDownloads();
    const dashboard = buildDownloadDashboard(downloads, "complete", "movie");

    expect(dashboard.filteredDownloads.map((item) => item.gid)).toEqual(["3"]);
    expect(dashboard.counts).toMatchObject({
      active: 1,
      waiting: 1,
      paused: 1,
      complete: 1,
      error: 1,
      removed: 0,
    });
    expect(dashboard.totalSpeed).toBe(200);
    expect(dashboard.totalBytes).toBe(6600);
    expect(dashboard.completedBytes).toBe(3550);
    expect(dashboard.activeBytesRemaining).toBe(600);
  });

  it("searches download names and directories case-insensitively", () => {
    const dashboard = buildDownloadDashboard(sampleDownloads(), "all", "VIDEO");

    expect(dashboard.filteredDownloads.map((item) => item.gid)).toEqual(["3", "4"]);
  });

  it("builds top and recent directory summaries", () => {
    const dashboard = buildDownloadDashboard(sampleDownloads(), "all", "");

    expect(summarizeDirectories(dashboard.topDirectories)).toEqual([
      ["/downloads/video", 2, 3500, 3100, 0],
      ["/downloads/linux", 2, 3000, 400, 600],
      ["/downloads/docs", 1, 100, 50, 0],
    ]);
    expect(dashboard.recentDirectories.map((item) => item.directory)).toEqual([
      "/downloads/docs",
      "/downloads/video",
      "/downloads/linux",
    ]);
  });

  it("builds a dashboard for 1000 downloads within a conservative frame budget", () => {
    const downloads = Array.from({ length: 1000 }, (_, index) => {
      const status = statuses[index % statuses.length];
      return createDownload({
        gid: String(index),
        name: `file-${index}.bin`,
        status,
        directory: `/downloads/bucket-${index % 25}`,
        totalLength: 1_000_000 + index,
        completedLength: status === "complete" ? 1_000_000 + index : index * 100,
        downloadSpeed: status === "active" ? 512_000 + index : 0,
      });
    });

    buildDownloadDashboard(downloads, "all", "");
    const startedAt = performance.now();
    const dashboard = buildDownloadDashboard(downloads, "all", "file-9");
    const elapsed = performance.now() - startedAt;

    expect(dashboard.filteredDownloads.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(25);
  });
});

const statuses = ["active", "waiting", "paused", "complete", "error"] as const;

function sampleDownloads(): DownloadItem[] {
  return [
    createDownload({
      gid: "1",
      name: "Ubuntu ISO",
      status: "active",
      directory: "/downloads/linux",
      totalLength: 1000,
      completedLength: 400,
      downloadSpeed: 200,
    }),
    createDownload({
      gid: "2",
      name: "Fedora ISO",
      status: "waiting",
      directory: "/downloads/linux",
      totalLength: 2000,
      completedLength: 0,
    }),
    createDownload({
      gid: "3",
      name: "Movie Pack",
      status: "complete",
      directory: "/downloads/video",
      totalLength: 3000,
      completedLength: 3000,
    }),
    createDownload({
      gid: "4",
      name: "Broken Archive",
      status: "error",
      directory: "/downloads/video",
      totalLength: 500,
      completedLength: 100,
    }),
    createDownload({
      gid: "5",
      name: "Paused Notes",
      status: "paused",
      directory: "/downloads/docs",
      totalLength: 100,
      completedLength: 50,
    }),
  ];
}

function createDownload(overrides: Partial<DownloadItem>): DownloadItem {
  return {
    gid: "",
    name: "",
    status: "active",
    directory: "",
    totalLength: 0,
    completedLength: 0,
    progress: 0,
    downloadSpeed: 0,
    uploadSpeed: 0,
    connections: 0,
    etaSeconds: 0,
    errorCode: "",
    errorMessage: "",
    files: [],
    ...overrides,
  };
}

function summarizeDirectories(summaries: DownloadDirectorySummary[]): Array<[string, number, number, number, number]> {
  return summaries.map((summary) => [
    summary.directory,
    summary.count,
    summary.totalBytes,
    summary.completedBytes,
    summary.activeBytesRemaining,
  ]);
}

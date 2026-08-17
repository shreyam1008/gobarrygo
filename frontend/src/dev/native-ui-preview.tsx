import { useEffect, useRef } from "react";
import {
  DownloadFile,
  DownloadItem,
  Health,
  Metrics,
  VersionInfo,
} from "@bindings/github.com/shreyam1008/gobarrygo/internal/contracts/models.js";
import { AddDownloadDialog } from "@/features/downloads/add-download-dialog";
import { DownloadQueue } from "@/features/downloads/download-queue";
import { InspectorPanel } from "@/features/downloads/inspector-panel";
import { NavigationRail } from "@/features/navigation/navigation-rail";
import { AppTitlebar } from "@/features/shell/app-titlebar";
import { QuickAddBar } from "@/features/shell/quick-add-bar";
import { buildDownloadDashboard } from "@/lib/download-model";

const GiB = 1024 ** 3;
const MiB = 1024 ** 2;
const directories = ["/home/alex/Downloads", "/home/alex/Downloads/ISOs", "/home/alex/Projects", "/mnt/media"];

const downloads = [
  sample("01", "ubuntu-24.04-desktop-amd64.iso", "active", 3.99 * GiB, 68.3, 11.2 * MiB, 84, "releases.ubuntu.com", directories[1], 16, 84_000),
  sample("02", "Fedora-Workstation-Live-x86_64-40.iso", "active", 4.53 * GiB, 32.7, 6.4 * MiB, 250, "download.fedoraproject.org", directories[1], 10),
  sample("03", "linuxmint-21.3-cinnamon-64bit.iso", "active", 2.05 * GiB, 8.9, 3.1 * MiB, 1172, "mirrors.edge.kernel.org", directories[1], 8),
  sample("04", "debian-12.5.0-amd64-netinst.iso", "waiting", 647 * MiB, 0, 0, 0, "cdimage.debian.org", directories[1], 0),
  sample("05", "gimp-2.10.38-setup.exe", "waiting", 306.5 * MiB, 0, 0, 0, "download.gimp.org", directories[0], 0),
  sample("06", "blender-4.1.1-windows-x64.msi", "paused", 267.6 * MiB, 0, 0, 0, "ftp.nluug.nl", directories[0], 0),
  sample("07", "OBS-Studio-30.1.2-Windows-Installer.exe", "complete", 129.4 * MiB, 100, 0, 0, "cdn-fastly.obsproject.com", directories[0], 0),
  sample("08", "vscode-win32-x64-1.90.2.zip", "complete", 96 * MiB, 100, 0, 0, "update.code.visualstudio.com", directories[2], 0),
  sample("09", "kali-linux-2024.1-installer-amd64.iso", "complete", 4.1 * GiB, 100, 0, 0, "http.kali.org", directories[1], 0),
  sample("10", "some-file-from-badhost.zip", "error", 512 * MiB, 0, 0, 0, "badhost.example.com", directories[3], 0, 0, "Connection reset by peer"),
  sample("11", "archive-part1.rar", "complete", GiB, 100, 0, 0, "archive.org", directories[3], 0),
  sample("12", "archive-part2.rar", "active", GiB, 54.2, 2 * MiB, 198, "archive.org", directories[3], 6, 32_000),
];

const dashboard = buildDownloadDashboard(downloads, "all", "");
const metrics = new Metrics({
  activeCount: 4,
  waitingCount: 2,
  stoppedCount: 6,
  totalCount: downloads.length,
  downloadSpeed: downloads.reduce((total, item) => total + item.downloadSpeed, 0),
  uploadSpeed: downloads.reduce((total, item) => total + item.uploadSpeed, 0),
});

export function NativeUIPreview({ dialogOpen }: { dialogOpen: boolean }) {
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!dialogOpen) {
      return;
    }
    const previewLinks = [
      "https://releases.ubuntu.com/24.04/ubuntu-24.04.1-desktop-amd64.iso",
      "https://cdn.kernel.org/pub/linux/kernel/v6.x/linux-6.9.4.tar.xz",
      "https://archive.org/download/Big_Buck_Bunny_1080p/Big_Buck_Bunny_1080p.mp4",
    ].join("\n");
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { readText: async () => previewLinks },
    });
    window.setTimeout(() => {
      document.querySelector<HTMLButtonElement>(".field-head button")?.click();
    }, 0);
  }, [dialogOpen]);

  return (
    <div className="shell">
      <AppTitlebar
        version={new VersionInfo({ number: "0.0.9", codename: "CHITRA" })}
        health={new Health({ ready: true, status: "running", message: "Ready", rpcPort: 6800 })}
      />
      <QuickAddBar directory={directories[0]} directoryOptions={directories} defaultUserAgent="GoBarryGo/0.0.9" />
      <main className="workspace">
        <NavigationRail currentFilter="all" downloads={downloads} counts={dashboard.counts} directoryOptions={directories} quickDirectory={directories[0]} />
        <DownloadQueue
          dashboard={dashboard}
          metrics={metrics}
          peakDownloadSpeed={28 * MiB}
          loading={false}
          search=""
          searchRef={searchRef}
          selectedGID={downloads[0].gid}
          onShowDetails={() => undefined}
        />
        <InspectorPanel item={downloads[0]} onClose={() => undefined} />
      </main>
      <AddDownloadDialog open={dialogOpen} defaultDirectory={directories[0]} recentDirectories={directories} onClose={() => undefined} />
    </div>
  );
}

function sample(
  gid: string,
  name: string,
  status: string,
  totalLength: number,
  progress: number,
  downloadSpeed: number,
  etaSeconds: number,
  host: string,
  directory: string,
  connections: number,
  uploadSpeed = 0,
  errorMessage = "",
): DownloadItem {
  const completedLength = Math.round(totalLength * progress / 100);
  return new DownloadItem({
    gid,
    name,
    status,
    directory,
    totalLength: Math.round(totalLength),
    completedLength,
    progress,
    downloadSpeed: Math.round(downloadSpeed),
    uploadSpeed,
    connections,
    etaSeconds,
    errorCode: errorMessage ? "1" : "",
    errorMessage,
    files: [new DownloadFile({
      index: 0,
      path: `${directory}/${name}`,
      length: Math.round(totalLength),
      completedLength,
      selected: true,
      uris: [`https://${host}/${encodeURIComponent(name)}`],
    })],
  });
}

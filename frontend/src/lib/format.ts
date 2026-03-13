export function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const size = value / 1024 ** index;
  const precision = size >= 100 || index === 0 ? 0 : size >= 10 ? 1 : 2;
  return `${size.toFixed(precision)} ${units[index]}`;
}

export function formatSpeed(value: number): string {
  return `${formatBytes(value)}/s`;
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "0%";
  }
  if (value >= 100) {
    return "100%";
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)}%`;
}

export function formatETA(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "Ready";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
}

export function formatStatus(status: string): string {
  switch (status) {
    case "active":
      return "Active";
    case "waiting":
      return "Queued";
    case "paused":
      return "Paused";
    case "complete":
      return "Complete";
    case "error":
      return "Error";
    case "removed":
      return "Removed";
    default:
      return status || "Unknown";
  }
}


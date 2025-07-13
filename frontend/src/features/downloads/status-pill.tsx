import { formatStatus } from "@/lib/format";

type Props = {
  status: string;
};

export function StatusPill({ status }: Props) {
  return <span className={`status-pill status-pill--${status || "idle"}`}>{formatStatus(status)}</span>;
}


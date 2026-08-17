import { formatStatus } from "@/lib/format";

type Props = {
  status: string;
};

export function StatusPill({ status }: Props) {
  return <span className={`st st-${status || "idle"}`}>{formatStatus(status)}</span>;
}

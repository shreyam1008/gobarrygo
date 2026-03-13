type Props = {
  label: string;
  value: string;
  detail: string;
};

export function StatCard({ label, value, detail }: Props) {
  return (
    <article className="stat-card">
      <span className="stat-card__label">{label}</span>
      <strong className="stat-card__value">{value}</strong>
      <span className="stat-card__detail">{detail}</span>
    </article>
  );
}


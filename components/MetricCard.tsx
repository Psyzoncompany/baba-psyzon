import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type MetricCardProps = Readonly<{
  label: string;
  value: ReactNode;
  detail?: string;
  icon: LucideIcon;
}>;

export function MetricCard({ label, value, detail, icon: Icon }: MetricCardProps) {
  return (
    <article className="metric-card">
      <span className="metric-card__icon"><Icon aria-hidden="true" size={18} /></span>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </article>
  );
}

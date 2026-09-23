import type { ReactNode } from 'react';

interface HomeMetricProps {
  label: string;
  value?: ReactNode;
  detail?: string;
  status?: 'available' | 'not-connected';
  unavailableLabel?: string;
  accent?: string;
  onClick?: () => void;
}

export function HomeMetric({
  label,
  value,
  detail,
  status = 'available',
  unavailableLabel = 'Not connected',
  accent = 'var(--workspace-accent)',
  onClick,
}: HomeMetricProps) {
  const content = (
    <>
      <span className="home-metric-accent" style={{ backgroundColor: status === 'available' ? accent : 'var(--workspace-text-subtle)' }} />
      <span className="home-metric-label">{label}</span>
      <strong className={status === 'available' ? 'home-metric-value' : 'home-metric-value home-metric-unavailable'}>
        {status === 'available' ? value : unavailableLabel}
      </strong>
      {detail && <span className="home-metric-detail">{detail}</span>}
    </>
  );

  return onClick ? (
    <button type="button" className="home-metric home-metric-interactive" onClick={onClick}>
      {content}
    </button>
  ) : (
    <div className="home-metric">{content}</div>
  );
}

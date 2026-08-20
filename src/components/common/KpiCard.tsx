interface KpiCardProps {
  title: string;
  value?: string | number;
  subtitle?: string;
  accent?: string;
  status?: 'available' | 'not-connected';
  onClick?: () => void;
  // Optional, defaults to the original size used everywhere (including
  // Campaign Detail's KPI strip) so existing call sites are unaffected.
  // 'compact' is used by the Overview's Channel Snapshot, where five
  // smaller cards read better than the full headline-KPI treatment.
  size?: 'default' | 'compact';
}

// Shared V2 KPI tile. Renders an honest "Not connected" state instead of a
// fabricated £0/0 when the underlying data source doesn't exist yet
// (see NOT_CONNECTED_METRICS in Overview — Acumatica-sourced metrics).
export function KpiCard({ title, value, subtitle, accent = 'var(--v2-purple)', status = 'available', onClick, size = 'default' }: KpiCardProps) {
  const isNotConnected = status === 'not-connected';
  const valueClass = size === 'compact' ? 'text-xl font-bold text-text-primary truncate' : 'text-3xl font-bold text-text-primary truncate';

  return (
    <div
      className="card v2-kpi-card"
      style={{ borderLeft: `4px solid ${isNotConnected ? 'var(--v2-grey)' : accent}`, cursor: onClick ? 'pointer' : undefined, minWidth: 0 }}
      onClick={onClick}
    >
      <div className="text-text-secondary text-sm font-medium mb-3 truncate">{title}</div>
      {isNotConnected ? (
        <>
          <div className="v2-kpi-not-connected">Not connected</div>
          {subtitle && <div className="text-xs text-text-secondary mt-2">{subtitle}</div>}
        </>
      ) : (
        <>
          <div className={valueClass} style={{ fontVariantNumeric: 'tabular-nums' }}>
            {value}
          </div>
          {subtitle && <div className="text-xs text-text-secondary mt-2 truncate">{subtitle}</div>}
        </>
      )}
    </div>
  );
}

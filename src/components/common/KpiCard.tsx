import type { PeriodComparison } from '@/utils/periodComparison';

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
  // Optional previous-period comparison (src/utils/periodComparison.ts).
  // Omitted entirely by default — every existing call site is unaffected
  // unless a screen deliberately opts in. `null` (as opposed to omitted)
  // means "this KPI could support a comparison but none was computed";
  // `comparison.previous === null` means "genuinely couldn't obtain a
  // previous-period figure" — rendered as an honest "not available", never
  // a fabricated 0% or hidden entirely.
  comparison?: PeriodComparison | null;
  // Overrides the "Not connected" headline text shown when status is
  // 'not-connected' — e.g. "Not available" for a source that structurally
  // doesn't cover this entity (IRCL isn't in Acumatica at all) rather than
  // one that simply isn't wired up yet. Defaults to "Not connected" so
  // every existing call site is unaffected.
  notConnectedLabel?: string;
}

// Shared V2 KPI tile. Renders an honest "Not connected" state instead of a
// fabricated £0/0 when the underlying data source doesn't exist yet
// (see NOT_CONNECTED_METRICS in Overview — Acumatica-sourced metrics).
export function KpiCard({ title, value, subtitle, accent = 'var(--v2-purple)', status = 'available', onClick, size = 'default', comparison, notConnectedLabel = 'Not connected' }: KpiCardProps) {
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
          <div className="v2-kpi-not-connected">{notConnectedLabel}</div>
          {subtitle && <div className="text-xs text-text-secondary mt-2">{subtitle}</div>}
        </>
      ) : (
        <>
          <div className={valueClass} style={{ fontVariantNumeric: 'tabular-nums' }}>
            {value}
          </div>
          {subtitle && <div className="text-xs text-text-secondary mt-2 truncate">{subtitle}</div>}
          {comparison && <ComparisonBadge comparison={comparison} />}
        </>
      )}
    </div>
  );
}

function ComparisonBadge({ comparison }: { comparison: PeriodComparison }) {
  if (comparison.previous == null) {
    return <div className="text-xs text-text-secondary mt-1">vs last period: not available</div>;
  }
  const { percentChange, absoluteChange } = comparison;
  // percentChange is null only when the previous value was genuinely 0 —
  // a % change against zero isn't meaningful, so show the real absolute
  // change instead of a fabricated "+∞%" or hidden figure.
  const color = absoluteChange === 0 ? 'var(--v2-grey)' : absoluteChange! > 0 ? 'var(--v2-green)' : 'var(--v2-red)';
  const sign = absoluteChange! > 0 ? '+' : '';
  const text = percentChange != null ? `${sign}${percentChange}% vs last period` : `${sign}${absoluteChange} vs last period`;
  return (
    <div className="text-xs mt-1" style={{ color }}>
      {text}
    </div>
  );
}

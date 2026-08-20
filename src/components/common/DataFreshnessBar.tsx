export type FreshnessStatus = 'live' | 'stale' | 'error' | 'not-connected';

export interface FreshnessEntry {
  label: string;
  status: FreshnessStatus;
  detail: string;
}

const STATUS_COLOR: Record<FreshnessStatus, string> = {
  live: 'var(--v2-green)',
  stale: 'var(--v2-orange)',
  error: 'var(--v2-red)',
  'not-connected': 'var(--v2-grey)',
};

// Honest per-integration freshness strip. Every entry's status is derived
// from real signals (see Overview) — never assumed "healthy" by default.
export function DataFreshnessBar({ entries }: { entries: FreshnessEntry[] }) {
  return (
    <div className="v2-freshness-bar" aria-label="Data source freshness">
      {entries.map((entry) => (
        <span key={entry.label} className="v2-freshness-item">
          <span className="v2-freshness-dot" style={{ backgroundColor: STATUS_COLOR[entry.status] }} />
          <span className="v2-freshness-label">{entry.label}</span>
          <span className="v2-freshness-detail">{entry.detail}</span>
        </span>
      ))}
    </div>
  );
}

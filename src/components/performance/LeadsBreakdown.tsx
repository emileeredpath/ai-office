export interface LeadsBreakdownRow {
  key: string;
  label: string;
  value: number;
  color: string;
  onClick?: () => void;
}

// Simple honest horizontal-bar comparison — real lead totals only, one
// consistent metric per row so a single colour per entity/campaign is
// enough to carry identity (matches BrandBadge's existing colours at
// group level). No chart library, no fabricated proportions: an empty
// scope shows a clean empty state rather than a zero-width bar set.
export function LeadsBreakdown({ rows, emptyLabel }: { rows: LeadsBreakdownRow[]; emptyLabel: string }) {
  if (rows.length === 0) {
    return <p className="v2-not-connected-text">{emptyLabel}</p>;
  }

  const maxValue = Math.max(1, ...rows.map((r) => r.value));

  return (
    <div className="v2-leads-breakdown">
      {rows.map((row) => {
        const widthPct = row.value === 0 ? 2 : Math.max(4, Math.round((row.value / maxValue) * 100));
        const Tag = row.onClick ? 'button' : 'div';
        return (
          <Tag
            key={row.key}
            className="v2-leads-breakdown-row"
            onClick={row.onClick}
            title={`${row.label}: ${row.value.toLocaleString()} leads`}
          >
            <span className="v2-leads-breakdown-label">{row.label}</span>
            <span className="v2-leads-breakdown-track">
              <span className="v2-leads-breakdown-fill" style={{ width: `${widthPct}%`, backgroundColor: row.color }} />
            </span>
            <span className="v2-leads-breakdown-value">{row.value.toLocaleString()}</span>
          </Tag>
        );
      })}
    </div>
  );
}

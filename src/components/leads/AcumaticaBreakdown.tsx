import type { AcumaticaBreakdownEntry } from '@/services/acumaticaApi';

// Two small, reusable renderings of a single Acumatica opportunity-analysis
// breakdown (src/services/acumaticaApi.ts's AcumaticaBreakdownEntry —
// backed by getAcumaticaBreakdowns() on the backend). Every `key` here is
// either a raw Acumatica value (Stage, Opportunity Class, Product Focus,
// Sales-reported Source — shown exactly as stored, never renamed) or one
// of our own controlled labels (commercialStatus, brand — mapped via
// `labelFor` since those already have an approved canonical label, unlike
// the free-text Acumatica fields). Never invents a category: a genuinely
// blank/null source value already arrives here as "Unspecified" from the
// backend (formatUnspecified/formatSalesReportedSource), not decided here.

interface BreakdownProps {
  entries: AcumaticaBreakdownEntry[];
  emptyLabel: string;
  maxItems?: number;
  labelFor?: (key: string) => string;
  color?: string;
}

// Primary analysis — a horizontal bar per category, scaled by opportunity
// count (always present and comparable, unlike value which can be null
// for some rows), with count and total value shown alongside.
export function AcumaticaBreakdownBars({ entries, emptyLabel, maxItems = 8, labelFor, color = 'var(--v2-purple)' }: BreakdownProps) {
  if (entries.length === 0) {
    return <p className="v2-not-connected-text">{emptyLabel}</p>;
  }
  const shown = entries.slice(0, maxItems);
  const max = Math.max(...shown.map((e) => e.count), 1);

  return (
    <div className="v2-acu-breakdown">
      {shown.map((e) => {
        const label = labelFor ? labelFor(e.key) : e.key;
        return (
          <div key={e.key} className="v2-acu-breakdown-row">
            <span className="v2-acu-breakdown-label" title={label}>{label}</span>
            <span className="v2-acu-breakdown-track">
              <span className="v2-acu-breakdown-fill" style={{ width: `${(e.count / max) * 100}%`, backgroundColor: color }} />
            </span>
            <span className="v2-acu-breakdown-meta">
              {e.count} · £{Math.round(e.value).toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Secondary / compact analysis — a plain table, for breakdowns better read
// as a short list than a bar chart (few categories, or a category name
// that benefits from its own column rather than a truncated bar label).
export function AcumaticaBreakdownTable({
  columnLabel,
  entries,
  emptyLabel,
  labelFor,
}: BreakdownProps & { columnLabel: string }) {
  if (entries.length === 0) {
    return <p className="v2-not-connected-text">{emptyLabel}</p>;
  }
  return (
    <table className="table" style={{ width: '100%' }}>
      <thead>
        <tr>
          <th>{columnLabel}</th>
          <th style={{ textAlign: 'right' }}>Count</th>
          <th style={{ textAlign: 'right' }}>Value</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e) => (
          <tr key={e.key}>
            <td>{labelFor ? labelFor(e.key) : e.key}</td>
            <td style={{ textAlign: 'right' }}>{e.count}</td>
            <td style={{ textAlign: 'right' }}>£{Math.round(e.value).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

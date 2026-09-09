import { Brand } from '@/types/index';
import { BrandBadge } from '@/components/common/BrandBadge';

// Per-brand Acumatica commercial figures for MTech Group view — same
// three-state honesty as Performance's Performance by Entity table:
// 'not-available' is a brand structurally outside Acumatica (IRCL),
// 'not-connected' means this brand has no imported opportunities of its
// own (never inferred from another brand's import), 'available' only
// once real imported data exists for THIS brand. Never a fabricated
// £0/0.
export interface EntityCommercialRow {
  brand: Brand;
  label: string;
  status: 'available' | 'not-connected' | 'not-available';
  opportunities?: number;
  openPipelineValue?: number;
  wonDeals?: number;
  wonRevenue?: number;
  lostDeals?: number;
  subtitle: string;
}

function cell(row: EntityCommercialRow, value: number | undefined, format: (n: number) => string) {
  if (row.status !== 'available' || value === undefined) {
    return <span className="v2-not-connected-text">{row.status === 'not-available' ? 'Not available' : 'Not connected'}</span>;
  }
  return format(value);
}

export function CommercialByEntityTable({ rows }: { rows: EntityCommercialRow[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table" style={{ width: '100%', minWidth: 700 }}>
        <thead>
          <tr>
            <th>Entity</th>
            <th style={{ textAlign: 'right' }}>Opportunities</th>
            <th style={{ textAlign: 'right' }}>Open Pipeline</th>
            <th style={{ textAlign: 'right' }}>Won Deals</th>
            <th style={{ textAlign: 'right' }}>Won Revenue</th>
            <th style={{ textAlign: 'right' }}>Lost</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.brand} title={row.subtitle}>
              <td>
                <BrandBadge brand={row.brand} />
              </td>
              <td style={{ textAlign: 'right' }}>{cell(row, row.opportunities, (n) => String(n))}</td>
              <td style={{ textAlign: 'right' }}>{cell(row, row.openPipelineValue, (n) => `£${Math.round(n).toLocaleString()}`)}</td>
              <td style={{ textAlign: 'right' }}>{cell(row, row.wonDeals, (n) => String(n))}</td>
              <td style={{ textAlign: 'right' }}>{cell(row, row.wonRevenue, (n) => `£${Math.round(n).toLocaleString()}`)}</td>
              <td style={{ textAlign: 'right' }}>{cell(row, row.lostDeals, (n) => String(n))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

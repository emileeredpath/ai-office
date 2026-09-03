import { Brand } from '@/types/index';
import { BrandBadge } from '@/components/common/BrandBadge';
import { getLeadConversion } from '@/utils/campaignMetrics';

export interface BrandPerformanceRow {
  brand: Brand;
  label: string;
  enquiries: number;
  leads: number;
  spend: number;
  // Real GA4 activeUsers for this brand's property, or null when that
  // entity's GA4 property isn't configured (or the fetch failed) — never
  // a fabricated 0.
  websiteUsers: number | null;
}

// Group-level comparison only — Entity is a real filter. Website Users is
// real GA4 data (Phase 1) where a brand's property is configured;
// Opportunities/Pipeline/Won Revenue have no data source yet (Acumatica
// is unconnected), so those columns stay honest "Not connected" cells.
export function PerformanceByBrandTable({ rows }: { rows: BrandPerformanceRow[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table" style={{ width: '100%', minWidth: 880 }}>
        <thead>
          <tr>
            <th>Entity</th>
            <th style={{ textAlign: 'right' }}>Website Users</th>
            <th style={{ textAlign: 'right' }}>Enquiries</th>
            <th style={{ textAlign: 'right' }}>Marketing Leads</th>
            <th style={{ textAlign: 'right' }}>Marketing Spend</th>
            <th style={{ textAlign: 'right' }}>Opportunities</th>
            <th style={{ textAlign: 'right' }}>Open Pipeline</th>
            <th style={{ textAlign: 'right' }}>Won Revenue</th>
            <th style={{ textAlign: 'right' }}>Lead Conversion</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const conversion = getLeadConversion(row.enquiries, row.leads);
            return (
              <tr key={row.brand}>
                <td>
                  <BrandBadge brand={row.brand} />
                </td>
                <td style={{ textAlign: 'right' }}>
                  {row.websiteUsers != null ? row.websiteUsers.toLocaleString() : <span className="v2-not-connected-text">Not connected</span>}
                </td>
                <td style={{ textAlign: 'right' }}>{row.enquiries}</td>
                <td style={{ textAlign: 'right' }}>{row.leads}</td>
                <td style={{ textAlign: 'right' }}>£{Math.round(row.spend).toLocaleString()}</td>
                <td style={{ textAlign: 'right' }}><span className="v2-not-connected-text">Not connected</span></td>
                <td style={{ textAlign: 'right' }}><span className="v2-not-connected-text">Not connected</span></td>
                <td style={{ textAlign: 'right' }}><span className="v2-not-connected-text">Not connected</span></td>
                <td style={{ textAlign: 'right' }}>
                  {conversion ? (
                    <span style={{ fontWeight: 600 }}>{conversion.rate.toFixed(1)}%</span>
                  ) : (
                    <span className="v2-not-connected-text">Not available</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-xs text-text-secondary mt-2">
        Lead Conversion is Marketing Leads ÷ Enquiries, both manually logged per campaign — shown only where both figures exist for this period.
      </p>
    </div>
  );
}

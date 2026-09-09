import { Brand } from '@/types/index';
import { BrandBadge } from '@/components/common/BrandBadge';

// Per-brand Acumatica commercial figures — same shape/states as
// src/services/acumaticaApi.ts's AcumaticaSummary, reduced to what this
// table shows. 'not-available' is a brand structurally outside Acumatica
// (IRCL); 'not-connected' means this brand has no imported opportunities
// of its own (see the Acumatica Per-Entity Availability phase — never
// inferred from another brand's import); either way this must never
// render as a real £0/0 opportunities.
export interface BrandAcumaticaInfo {
  status: 'available' | 'not-connected' | 'not-available';
  opportunities?: number;
  openPipelineValue?: number;
  openPipelineCount?: number;
  wonRevenue?: number;
  subtitle: string;
}

export interface BrandPerformanceRow {
  brand: Brand;
  label: string;
  // Real GA4 activeUsers for this brand's property, or null when that
  // entity's GA4 property isn't configured (or the fetch failed) — never
  // a fabricated 0.
  websiteUsers: number | null;
  // Verified GA4 Enquiry events for this brand, or null when this brand
  // has no verified GA4 Enquiry event definition (see src/utils/
  // ga4Enquiries.ts) — never invented for an entity without one.
  ga4Enquiries: number | null;
  leads: number;
  // Known Campaign Spend (Fixed Costs + connected Media Spend) summed
  // across this brand's campaigns — see src/utils/campaignCosts.ts. Never
  // raw campaign.spend.
  spend: number;
  hasLegacySpendFallback: boolean;
  acumatica: BrandAcumaticaInfo;
}

// Group-level comparison only — Entity is a real filter. Recommended
// column set for management comparison (Performance V2 redesign):
// Website Users, GA4 Enquiries, Marketing Leads, Marketing Spend,
// Opportunities, Open Pipeline, Won Revenue. Manually-logged Enquiries
// and Lead Conversion are deliberately not repeated here — Marketing
// Leads and GA4 Enquiries already give management the comparison signal,
// and both remain visible per-campaign in the Campaign Performance table
// below for anyone drilling in further.
export function PerformanceByBrandTable({ rows }: { rows: BrandPerformanceRow[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table" style={{ width: '100%', minWidth: 820 }}>
        <thead>
          <tr>
            <th>Entity</th>
            <th style={{ textAlign: 'right' }}>Website Users</th>
            <th style={{ textAlign: 'right' }}>GA4 Enquiries</th>
            <th style={{ textAlign: 'right' }}>Marketing Leads</th>
            <th style={{ textAlign: 'right' }}>Marketing Spend</th>
            <th style={{ textAlign: 'right' }}>Opportunities</th>
            <th style={{ textAlign: 'right' }}>Open Pipeline</th>
            <th style={{ textAlign: 'right' }}>Won Revenue</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.brand}>
              <td>
                <BrandBadge brand={row.brand} />
              </td>
              <td style={{ textAlign: 'right' }}>
                {row.websiteUsers != null ? row.websiteUsers.toLocaleString() : <span className="v2-not-connected-text">Not connected</span>}
              </td>
              <td style={{ textAlign: 'right' }}>
                {row.ga4Enquiries != null ? row.ga4Enquiries.toLocaleString() : <span className="v2-not-connected-text">Not available</span>}
              </td>
              <td style={{ textAlign: 'right' }}>{row.leads}</td>
              <td style={{ textAlign: 'right' }} title={row.hasLegacySpendFallback ? 'Includes a campaign relying on legacy cost classification' : 'Fixed costs + connected media spend'}>
                £{Math.round(row.spend).toLocaleString()}
                {row.hasLegacySpendFallback && (
                  <div className="text-xs" style={{ color: 'var(--v2-orange)', whiteSpace: 'nowrap' }}>
                    Needs classification
                  </div>
                )}
              </td>
              <td style={{ textAlign: 'right' }} title={row.acumatica.subtitle}>
                {row.acumatica.status === 'available' ? row.acumatica.opportunities : <span className="v2-not-connected-text">{row.acumatica.status === 'not-available' ? 'Not available' : 'Not connected'}</span>}
              </td>
              <td style={{ textAlign: 'right' }} title={row.acumatica.subtitle}>
                {row.acumatica.status === 'available' ? `£${Math.round(row.acumatica.openPipelineValue!).toLocaleString()}` : <span className="v2-not-connected-text">{row.acumatica.status === 'not-available' ? 'Not available' : 'Not connected'}</span>}
              </td>
              <td style={{ textAlign: 'right' }} title={row.acumatica.subtitle}>
                {row.acumatica.status === 'available' ? `£${Math.round(row.acumatica.wonRevenue!).toLocaleString()}` : <span className="v2-not-connected-text">{row.acumatica.status === 'not-available' ? 'Not available' : 'Not connected'}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-text-secondary mt-2">
        Opportunities, Open Pipeline and Won Revenue are overall commercial performance from imported Acumatica opportunity data. Not attributed to Marketing unless explicitly linked.
      </p>
    </div>
  );
}

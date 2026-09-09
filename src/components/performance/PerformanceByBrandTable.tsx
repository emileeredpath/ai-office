import { Brand } from '@/types/index';
import { BrandBadge } from '@/components/common/BrandBadge';
import { getLeadConversion } from '@/utils/campaignMetrics';

// Per-brand Acumatica commercial figures — same shape/states as
// src/services/acumaticaApi.ts's AcumaticaSummary, reduced to what this
// table shows. 'not-available' is a brand structurally outside Acumatica
// (IRCL); 'not-connected' means no manual export has been imported yet;
// either way this must never render as a real £0/0 opportunities.
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
  enquiries: number;
  leads: number;
  // Known Campaign Spend (Fixed Costs + connected Media Spend) summed
  // across this brand's campaigns — see src/utils/campaignCosts.ts. Never
  // raw campaign.spend.
  spend: number;
  hasLegacySpendFallback: boolean;
  // Real GA4 activeUsers for this brand's property, or null when that
  // entity's GA4 property isn't configured (or the fetch failed) — never
  // a fabricated 0.
  websiteUsers: number | null;
  acumatica: BrandAcumaticaInfo;
}

// Group-level comparison only — Entity is a real filter. Website Users is
// real GA4 data (Phase 1) where a brand's property is configured; Spend is
// canonical Known Campaign Spend; Opportunities/Pipeline/Won Revenue come
// from the same manual Acumatica reporting Leads & CRM uses, per brand and
// period — an honest "Not connected"/"Not available" cell when no import
// covers this brand rather than a fabricated £0/0.
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
      <p className="text-xs text-text-secondary mt-1">
        Opportunities, Open Pipeline and Won Revenue are overall commercial performance from imported Acumatica opportunity data. Not attributed to Marketing unless explicitly linked.
      </p>
    </div>
  );
}

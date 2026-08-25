import { Target } from 'lucide-react';
import { BrandBadge } from '@/components/common/BrandBadge';
import type { GoogleAdsCampaignsInfo } from '@/utils/googleAdsPerformance';

const NotAvailable = ({ label = 'Not connected' }: { label?: string }) => (
  <span className="v2-not-connected-text">{label}</span>
);

function currency(n: number): string {
  return `£${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface PpcCampaignTableProps {
  campaigns: GoogleAdsCampaignsInfo;
  showEntityColumn: boolean;
}

// Real Google Ads campaign performance — never fuzzy-matched to a
// dashboard Campaign record; campaign identity (name, status, type) is
// shown exactly as Google Ads returns it. Marketing Leads, Opportunities,
// Pipeline, Won Revenue and ROAS require CRM attribution from Acumatica
// and are deliberately not columns here — see the page's separate
// Commercial section.
export function PpcCampaignTable({ campaigns, showEntityColumn }: PpcCampaignTableProps) {
  const columns = [
    'Campaign',
    ...(showEntityColumn ? ['Entity'] : []),
    'Status',
    'Type',
    'Impressions',
    'Clicks',
    'Spend',
    'Google Ads Conversions',
    'Cost per Conversion',
  ];

  if (campaigns.status !== 'available') {
    return (
      <div style={{ overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%', minWidth: 900 }}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col} style={{ whiteSpace: 'nowrap' }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={columns.length} style={{ padding: 0 }}>
                <div className="v2-crm-empty">
                  <Target size={28} color="var(--v2-grey)" />
                  <p className="v2-crm-empty-title">Google Ads campaign data not available</p>
                  <p className="v2-crm-empty-subtitle">{campaigns.subtitle}</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table" style={{ width: '100%', minWidth: 900 }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col} style={{ whiteSpace: 'nowrap' }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {campaigns.rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: 0 }}>
                <div className="v2-crm-empty">
                  <Target size={28} color="var(--v2-grey)" />
                  <p className="v2-crm-empty-title">No campaigns with activity in the selected period</p>
                </div>
              </td>
            </tr>
          ) : (
            campaigns.rows.map((row) => (
              <tr key={`${row.brand}-${row.campaignId}`}>
                <td className="text-text-primary">{row.campaignName}</td>
                {showEntityColumn && <td><BrandBadge brand={row.brand} /></td>}
                <td className="text-xs text-text-secondary">{row.status}</td>
                <td className="text-xs text-text-secondary">{row.advertisingChannelType}</td>
                <td>{row.impressions.toLocaleString('en-GB')}</td>
                <td>{row.clicks.toLocaleString('en-GB')}</td>
                <td>{currency(row.spend)}</td>
                <td>{row.conversions}</td>
                <td>{row.costPerConversion != null ? currency(row.costPerConversion) : <NotAvailable label="—" />}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {campaigns.hiddenZeroActivityCount > 0 && (
        <p className="text-xs text-text-secondary" style={{ padding: '0.75rem 1rem' }}>
          {campaigns.hiddenZeroActivityCount} campaign{campaigns.hiddenZeroActivityCount === 1 ? '' : 's'} with no
          impressions, clicks, or spend in this period {campaigns.hiddenZeroActivityCount === 1 ? 'is' : 'are'} hidden.
        </p>
      )}
    </div>
  );
}

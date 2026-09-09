import { useMemo } from 'react';
import { Campaign, CampaignCost } from '@/types/index';
import { BrandBadge } from '@/components/common/BrandBadge';
import { isWave1Campaign } from '@/utils/wave1';
import { getCampaignKnownSpend, LEGACY_COST_LABEL } from '@/utils/campaignCosts';
import type { GoogleAdsResponse } from '@/services/googleAdsApi';
import type { Wave1PerformanceData } from '@/store/useAppStore';

interface CampaignPerformanceTableProps {
  campaigns: Campaign[];
  wave1Performance: Wave1PerformanceData | null;
  campaignCosts: CampaignCost[];
  googleAdsPerformance: GoogleAdsResponse | null;
  showEntityColumn: boolean;
  onSelectCampaign: (id: string) => void;
}

// A lighter, performance-focused campaign table — deliberately not a
// reproduction of the Campaigns page's management table. Only the fields
// that answer "which campaigns are driving this entity's performance":
// real enquiries/leads/value-generated, plus genuine GA4/Infinity figures
// where they actually exist (today, only the Wave 1 campaign). Spend is
// the same canonical Known Campaign Spend (Fixed Costs + connected Media
// Spend) shown on the Campaigns list and Campaign Detail — never raw
// campaign.spend — so this table can never disagree with those screens.
export function CampaignPerformanceTable({ campaigns, wave1Performance, campaignCosts, googleAdsPerformance, showEntityColumn, onSelectCampaign }: CampaignPerformanceTableProps) {
  const withSpend = useMemo(
    () => campaigns.map((c) => ({ campaign: c, spendInfo: getCampaignKnownSpend(c, campaignCosts, googleAdsPerformance) })),
    [campaigns, campaignCosts, googleAdsPerformance]
  );
  const sorted = useMemo(
    () => [...withSpend].sort((a, b) => b.spendInfo.knownCampaignSpend - a.spendInfo.knownCampaignSpend),
    [withSpend]
  );

  if (sorted.length === 0) {
    return <p className="v2-not-connected-text">No campaigns to show{showEntityColumn ? '' : ' for this entity'}.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table v2-campaigns-table" style={{ width: '100%', minWidth: showEntityColumn ? 720 : 620 }}>
        <thead>
          <tr>
            <th>Campaign</th>
            {showEntityColumn && <th>Entity</th>}
            <th style={{ textAlign: 'right' }}>Enquiries</th>
            <th style={{ textAlign: 'right' }}>Marketing Leads</th>
            <th style={{ textAlign: 'right' }} title="Fixed costs + connected media spend">Spend</th>
            <th style={{ textAlign: 'right' }}>Value Generated</th>
            <th style={{ textAlign: 'right' }}>GA4 / Calls</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(({ campaign: c, spendInfo }) => {
            const wave1 = isWave1Campaign(c);
            const ga4 = wave1 ? wave1Performance?.ga4 : null;
            const infinity = wave1 ? wave1Performance?.infinity : null;
            const hasWave1Data = wave1 && wave1Performance?.configured && (ga4 || infinity);

            return (
              <tr key={c.id} onClick={() => onSelectCampaign(c.id)}>
                <td>
                  <span className="font-medium" style={{ color: 'var(--v2-purple)' }}>{c.name}</span>
                </td>
                {showEntityColumn && (
                  <td>
                    <BrandBadge brand={c.brand} />
                  </td>
                )}
                <td style={{ textAlign: 'right' }}>{c.results?.enquiriesReceived ?? <span className="v2-not-connected-text">—</span>}</td>
                <td style={{ textAlign: 'right' }}>{c.leads}</td>
                <td style={{ textAlign: 'right' }} title={spendInfo.isLegacyFallback ? LEGACY_COST_LABEL : 'Fixed costs + connected media spend'}>
                  £{Math.round(spendInfo.knownCampaignSpend).toLocaleString()}
                  {spendInfo.isLegacyFallback && (
                    <div className="text-xs" style={{ color: 'var(--v2-orange)', whiteSpace: 'nowrap' }}>
                      Needs classification
                    </div>
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>
                  {c.valueGenerated != null ? `£${Math.round(c.valueGenerated).toLocaleString()}` : <span className="v2-not-connected-text">Not logged</span>}
                </td>
                <td style={{ textAlign: 'right' }}>
                  {hasWave1Data ? (
                    <span className="text-xs">
                      {ga4 ? `${ga4.clicks} clicks · ${ga4.formSubmissions} subs` : ''}
                      {ga4 && infinity ? ' · ' : ''}
                      {infinity ? `${infinity.totalCalls} calls` : ''}
                    </span>
                  ) : (
                    <span className="v2-not-connected-text">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

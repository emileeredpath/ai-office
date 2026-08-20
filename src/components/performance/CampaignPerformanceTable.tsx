import { useMemo } from 'react';
import { Campaign } from '@/types/index';
import { BrandBadge } from '@/components/common/BrandBadge';
import { isWave1Campaign } from '@/utils/wave1';
import type { Wave1PerformanceData } from '@/store/useAppStore';

interface CampaignPerformanceTableProps {
  campaigns: Campaign[];
  wave1Performance: Wave1PerformanceData | null;
  showEntityColumn: boolean;
  onSelectCampaign: (id: string) => void;
}

// A lighter, performance-focused campaign table — deliberately not a
// reproduction of the Campaigns page's management table. Only the fields
// that answer "which campaigns are driving this entity's performance":
// real enquiries/leads/spend/value-generated, plus genuine GA4/Infinity
// figures where they actually exist (today, only the Wave 1 campaign).
export function CampaignPerformanceTable({ campaigns, wave1Performance, showEntityColumn, onSelectCampaign }: CampaignPerformanceTableProps) {
  const sorted = useMemo(() => [...campaigns].sort((a, b) => (b.spend || 0) - (a.spend || 0)), [campaigns]);

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
            <th style={{ textAlign: 'right' }}>Spend</th>
            <th style={{ textAlign: 'right' }}>Value Generated</th>
            <th style={{ textAlign: 'right' }}>GA4 / Calls</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((c) => {
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
                <td style={{ textAlign: 'right' }}>£{Math.round(c.spend || 0).toLocaleString()}</td>
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

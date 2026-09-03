import { useState } from 'react';
import { MoreHorizontal, ExternalLink } from 'lucide-react';
import { Campaign } from '@/types/index';
import { BrandBadge } from '@/components/common/BrandBadge';
import { formatDateShort } from '@/utils/dateUtils';
import { getCampaignProgressInfo } from '@/utils/campaignProgress';
import { CAMPAIGN_STATUS_BADGE_STYLE, CAMPAIGN_STATUS_LABEL } from '@/utils/campaignStatus';

interface CampaignsTableProps {
  campaigns: Campaign[];
  isEditor: boolean;
  acumaticaUrl: string;
  onSelectCampaign: (id: string) => void;
  onLogResults: (campaign: Campaign) => void;
  onDelete: (campaign: Campaign) => void;
}

const formatCurrency = (value: number | null | undefined) => {
  if (value == null) return '—';
  return '£' + value.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const isCampaignEnded = (endDate: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(endDate) < today;
};

// Campaigns V2: default table view. Replaces the card grid, which won't
// scale to dozens/hundreds of campaigns. Row/name click opens Campaign
// Detail; everything else (log results, Acumatica, delete) lives in a
// per-row overflow menu so the table stays scannable.
export function CampaignsTable({ campaigns, isEditor, acumaticaUrl, onSelectCampaign, onLogResults, onDelete }: CampaignsTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  if (campaigns.length === 0) {
    return <p className="text-text-secondary text-center py-12">No campaigns match these filters.</p>;
  }

  return (
    <div className="card p-0" style={{ overflow: 'visible' }}>
      <div style={{ overflowX: 'auto' }}>
        <table className="table v2-campaigns-table" style={{ width: '100%', minWidth: 900 }}>
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Entity</th>
              <th>Status</th>
              <th>Progress</th>
              <th style={{ textAlign: 'right' }}>
                Marketing Leads
                <div className="text-xs font-normal" style={{ textTransform: 'none', color: 'var(--color-text-secondary)' }}>
                  Manual, not CRM-linked
                </div>
              </th>
              <th style={{ textAlign: 'right' }}>Open Pipeline</th>
              <th style={{ textAlign: 'right' }}>Budget</th>
              <th style={{ textAlign: 'right' }}>Spend</th>
              <th style={{ textAlign: 'right' }}>ROI</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => {
              const entities = campaign.entities && campaign.entities.length > 0 ? campaign.entities : [campaign.brand];
              const progress = getCampaignProgressInfo(campaign.status, campaign.startDate, campaign.endDate);
              const roiValue =
                campaign.valueGenerated != null && campaign.spend > 0
                  ? Math.round(((campaign.valueGenerated - campaign.spend) / campaign.spend) * 100)
                  : null;
              const ended = isCampaignEnded(campaign.endDate);
              const menuOpen = openMenuId === campaign.id;

              return (
                <tr key={campaign.id} onClick={() => onSelectCampaign(campaign.id)}>
                  <td>
                    <button
                      className="v2-row-name-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCampaign(campaign.id);
                      }}
                    >
                      {campaign.name}
                    </button>
                  </td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      {entities.map((entity) => (
                        <BrandBadge key={entity} brand={entity} />
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className="badge" style={{ ...CAMPAIGN_STATUS_BADGE_STYLE[campaign.status], fontSize: '11px' }}>
                      {CAMPAIGN_STATUS_LABEL[campaign.status]}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="v2-progress-mini-track" title={progress.statusInconsistent ? progress.label : undefined}>
                        <span
                          className="v2-progress-mini-fill"
                          style={{ width: `${progress.percent}%`, display: 'block', backgroundColor: progress.statusInconsistent ? 'var(--v2-orange)' : undefined }}
                        />
                      </span>
                      <span
                        className="text-xs"
                        style={{ whiteSpace: 'nowrap', color: progress.statusInconsistent ? 'var(--v2-orange)' : 'var(--color-text-secondary)', fontWeight: progress.statusInconsistent ? 600 : 400 }}
                        title={progress.statusInconsistent ? progress.label : undefined}
                      >
                        {progress.percent}%
                      </span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>{campaign.leads}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="v2-not-connected-text">Not connected</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(campaign.budget)}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(campaign.spend)}</td>
                  <td style={{ textAlign: 'right' }}>
                    {roiValue !== null ? (
                      <span style={{ fontWeight: 600, color: roiValue >= 0 ? 'var(--v2-green)' : 'var(--v2-red)' }}>
                        {roiValue >= 0 ? '+' : ''}
                        {roiValue}%
                      </span>
                    ) : (
                      <span className="v2-not-connected-text">Not logged</span>
                    )}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="v2-overflow-wrap">
                      <button
                        className="v2-overflow-btn"
                        style={{ width: 30, height: 30 }}
                        onClick={() => setOpenMenuId(menuOpen ? null : campaign.id)}
                        title="More actions"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                      {menuOpen && (
                        <div className="v2-overflow-menu" onMouseLeave={() => setOpenMenuId(null)}>
                          <button
                            className="v2-overflow-item"
                            style={{ color: 'var(--color-text-primary)' }}
                            onClick={() => {
                              setOpenMenuId(null);
                              onSelectCampaign(campaign.id);
                            }}
                          >
                            View Campaign
                          </button>
                          {ended && (
                            <button
                              className="v2-overflow-item"
                              style={{ color: 'var(--color-text-primary)' }}
                              onClick={() => {
                                setOpenMenuId(null);
                                onLogResults(campaign);
                              }}
                            >
                              {campaign.results ? 'Edit Results' : 'Log Results'}
                            </button>
                          )}
                          {acumaticaUrl && (
                            <a
                              href={acumaticaUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="v2-overflow-item"
                              style={{ color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}
                              onClick={() => setOpenMenuId(null)}
                            >
                              View in Acumatica <ExternalLink size={12} />
                            </a>
                          )}
                          {isEditor && (
                            <button
                              className="v2-overflow-item"
                              style={{ borderTop: '1px solid var(--v2-border)', marginTop: 4 }}
                              onClick={() => {
                                setOpenMenuId(null);
                                onDelete(campaign);
                              }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

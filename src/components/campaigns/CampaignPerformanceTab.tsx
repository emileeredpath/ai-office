import { useState } from 'react';
import { Copy, Edit2, Trash2, Mail } from 'lucide-react';
import { nanoid } from 'nanoid';
import { Campaign, TrackingLink, Brand, CampaignCost } from '@/types/index';
import { BRAND_COLOR, BRAND_LABEL } from '@/utils/brandColors';
import { formatDateShort } from '@/utils/dateUtils';
import type { CampaignGoogleAdsAttribution, CampaignInfinityAttribution } from '@/utils/campaignAttribution';
import type { CampaignEmailPerformanceInfo } from '@/utils/emailPerformance';
import type { Ga4AttributionState } from '@/screens/CampaignDetailScreen';
import { CampaignCostsSection } from '@/components/campaigns/CampaignCostsSection';

interface CampaignPerformanceTabProps {
  campaign: Campaign;
  updateCampaign: (id: string, updates: Partial<Campaign>) => Promise<void>;
  showToast: (message: string) => void;
  googleAds: CampaignGoogleAdsAttribution | null;
  emailPerf: CampaignEmailPerformanceInfo | null;
  infinityAttribution: CampaignInfinityAttribution | null;
  ga4Attribution: Ga4AttributionState;
  campaignCosts: CampaignCost[];
  addCampaignCost: (cost: Omit<CampaignCost, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCampaignCost: (id: string, updates: Partial<CampaignCost>) => Promise<void>;
  deleteCampaignCost: (id: string) => Promise<void>;
}

const EMPTY_LINK_FORM = {
  entity: '' as Brand | '',
  name: '',
  channel: '',
  landingPage: '',
  utmSource: '',
  utmMedium: '',
  utmCampaign: '',
  utmContent: '',
};

// Detailed channel analytics: Google Ads, GA4, Campaign Monitor email,
// Infinity calls, and the full Tracking Links CRUD tool. All attribution
// data is fetched once by the parent CampaignDetailScreen and passed down
// as props here, so switching tabs never issues a duplicate set of API
// calls. Tracking links stay directly editable in place — this is
// attribution tooling a marketer actively manages, not a one-off record
// edit. Acumatica has no campaign-level relationship and is deliberately
// never referenced on this tab.
export function CampaignPerformanceTab({ campaign, updateCampaign, showToast, googleAds, emailPerf, infinityAttribution, ga4Attribution, campaignCosts, addCampaignCost, updateCampaignCost, deleteCampaignCost }: CampaignPerformanceTabProps) {
  const [trackingLinkForm, setTrackingLinkForm] = useState(EMPTY_LINK_FORM);
  const [editingTrackingLink, setEditingTrackingLink] = useState<string | null>(null);

  // Attribution fetches are lifted to the parent and still in flight on
  // first render — fall back to "not-connected" (never a guessed value)
  // until the real result arrives.
  const googleAdsData = googleAds ?? { status: 'not-connected' as const, spend: 0, impressions: 0, clicks: 0, ctr: null, averageCpc: null, conversions: 0, costPerConversion: null, matchedCampaigns: [] };
  const emailPerfData = emailPerf ?? { status: 'not-connected' as const, sends: [] };
  const infinityData = infinityAttribution ?? { status: 'not-connected' as const, calls: 0, answered: 0, missed: 0, answerRate: null };

  const resetLinkForm = () => {
    setTrackingLinkForm(EMPTY_LINK_FORM);
    setEditingTrackingLink(null);
  };

  return (
    <div className="space-y-8">
      <CampaignCostsSection
        campaign={campaign}
        campaignCosts={campaignCosts}
        googleAds={googleAds}
        addCampaignCost={addCampaignCost}
        updateCampaignCost={updateCampaignCost}
        deleteCampaignCost={deleteCampaignCost}
        showToast={showToast}
      />

      {/* Email Performance — the single source of truth for this campaign's
          send-level email data. Only genuine source: 'campaign-monitor'
          sends whose dashboardCampaignId already matches this campaign
          (set by the existing sync's name-based matching) ever appear here
          — never a fuzzy/similarly-named send. Duplicated Open %/Click %/
          Bounces/Unsubscribes were removed from the Content tab so this is
          the only place those figures come from. */}
      <div>
        <h3 className="v2-section-title">Email Performance</h3>
        {emailPerfData.status === 'available' && emailPerfData.sends.length > 0 ? (
          <div className="card p-4">
            <div className="overflow-x-auto">
              <table className="table w-full text-sm">
                <thead>
                  <tr>
                    <th>Send Name</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Recipients</th>
                    <th style={{ textAlign: 'right' }}>Delivered</th>
                    <th style={{ textAlign: 'right' }}>Unique Opens</th>
                    <th style={{ textAlign: 'right' }}>Clicks</th>
                    <th style={{ textAlign: 'right' }}>Bounces</th>
                    <th style={{ textAlign: 'right' }}>Unsubscribes</th>
                    <th>Campaign Monitor ID</th>
                  </tr>
                </thead>
                <tbody>
                  {emailPerfData.sends.map((send) => (
                    <tr key={send.taskId}>
                      <td className="text-text-primary">{send.campaignName}</td>
                      <td className="text-text-secondary">{formatDateShort(send.sentDate)}</td>
                      <td style={{ textAlign: 'right' }}>{send.recipients != null ? send.recipients.toLocaleString() : '—'}</td>
                      <td style={{ textAlign: 'right' }}>{send.delivered != null ? send.delivered.toLocaleString() : '—'}</td>
                      <td style={{ textAlign: 'right' }}>{send.uniqueOpens != null ? send.uniqueOpens.toLocaleString() : '—'}</td>
                      <td style={{ textAlign: 'right' }}>{send.clicks != null ? send.clicks.toLocaleString() : '—'}</td>
                      <td style={{ textAlign: 'right' }}>{send.bounces != null ? send.bounces.toLocaleString() : '—'}</td>
                      <td style={{ textAlign: 'right' }}>{send.unsubscribes != null ? send.unsubscribes.toLocaleString() : '—'}</td>
                      <td className="text-text-secondary text-xs">{send.campaignMonitorId ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card p-4">
            <div className="v2-crm-empty">
              <Mail size={28} color="var(--v2-grey)" />
              <p className="v2-crm-empty-title">
                {emailPerfData.status === 'not-connected' ? 'Campaign Monitor is not connected' : 'No Campaign Monitor sends are linked to this campaign'}
              </p>
              <p className="v2-crm-empty-subtitle">
                {emailPerfData.status === 'not-connected'
                  ? 'Email performance will appear here once Campaign Monitor is configured.'
                  : "Sends are linked automatically by the existing Campaign Monitor sync. If a real send for this campaign isn't showing, its name may not have matched — this is never guessed here."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Google Ads — deterministic only: sums real Google Ads campaign
          rows whose campaign.id exactly matches one of this campaign's own
          googleAdsCampaignIds (set via Edit Campaign). A campaign with none
          configured is shown as Unmatched, never a guessed £0 — see
          getGoogleAdsForCampaign's doc comment. */}
      <div>
        <h3 className="v2-section-title">Google Ads</h3>
        {googleAdsData.status === 'available' ? (
          <div className="card p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <div className="text-xs text-text-secondary mb-1">Spend</div>
                <div className="text-xl font-bold text-text-primary">£{googleAdsData.spend.toLocaleString('en-GB', { maximumFractionDigits: 2 })}</div>
              </div>
              <div>
                <div className="text-xs text-text-secondary mb-1">Impressions</div>
                <div className="text-xl font-bold text-text-primary">{googleAdsData.impressions.toLocaleString('en-GB')}</div>
              </div>
              <div>
                <div className="text-xs text-text-secondary mb-1">Clicks</div>
                <div className="text-xl font-bold text-text-primary">{googleAdsData.clicks.toLocaleString('en-GB')}</div>
              </div>
              <div>
                <div className="text-xs text-text-secondary mb-1">CTR</div>
                <div className="text-xl font-bold text-text-primary">{googleAdsData.ctr != null ? `${googleAdsData.ctr}%` : '—'}</div>
              </div>
              <div>
                <div className="text-xs text-text-secondary mb-1">Avg. CPC</div>
                <div className="text-xl font-bold text-text-primary">{googleAdsData.averageCpc != null ? `£${googleAdsData.averageCpc.toFixed(2)}` : '—'}</div>
              </div>
              <div>
                {/* Google Ads' own conversions metric — a fractional,
                    partial-credit count, never rounded. This is NOT the
                    same population as a GA4 Enquiry — never presented or
                    summed as if it were. */}
                <div className="text-xs text-text-secondary mb-1">Conversions</div>
                <div className="text-xl font-bold text-text-primary">{googleAdsData.conversions.toLocaleString('en-GB', { maximumFractionDigits: 2 })}</div>
              </div>
            </div>
            <table className="table w-full text-sm">
              <thead>
                <tr>
                  <th>Google Ads Campaign</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Spend</th>
                  <th style={{ textAlign: 'right' }}>Clicks</th>
                </tr>
              </thead>
              <tbody>
                {googleAdsData.matchedCampaigns.map((c) => (
                  <tr key={c.campaignId}>
                    <td className="text-text-primary">{c.campaignName}</td>
                    <td className="text-text-secondary capitalize">{c.status.toLowerCase()}</td>
                    <td style={{ textAlign: 'right' }}>£{c.spend.toLocaleString('en-GB', { maximumFractionDigits: 2 })}</td>
                    <td style={{ textAlign: 'right' }}>{c.clicks.toLocaleString('en-GB')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card p-4">
            <p className="text-sm text-text-secondary">
              {googleAdsData.status === 'not-connected'
                ? 'Google Ads is not connected.'
                : 'Unmatched — no Google Ads campaign ID is mapped to this campaign yet. Add one via Edit Campaign to attribute real spend, impressions, clicks, CTR, CPC and conversions here.'}
            </p>
          </div>
        )}
      </div>

      {/* Website response (GA4) — deterministic only: an exact match
          against this campaign's own explicit ga4CampaignNames (set via
          Edit Campaign), never derived from the campaign's own name. GA4
          Enquiries only shown where the brand has a verified definition —
          mtech and idaro genuinely have none, shown as "—", never a
          fabricated 0. See getCampaignGa4Attribution's doc comment. */}
      <div>
        <h3 className="v2-section-title">Website Response (GA4)</h3>
        {ga4Attribution.status === 'available' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="card p-4">
              <div className="text-sm text-text-secondary mb-1">Sessions</div>
              <div className="text-2xl font-bold">{ga4Attribution.sessions.toLocaleString('en-GB')}</div>
            </div>
            <div className="card p-4">
              <div className="text-sm text-text-secondary mb-1">Users</div>
              <div className="text-2xl font-bold">{ga4Attribution.users.toLocaleString('en-GB')}</div>
            </div>
            <div className="card p-4">
              <div className="text-sm text-text-secondary mb-1">GA4 Enquiries</div>
              <div className="text-2xl font-bold">{ga4Attribution.enquiries != null ? ga4Attribution.enquiries.toLocaleString('en-GB') : '—'}</div>
              {ga4Attribution.enquiries == null && (
                <div className="text-xs text-text-secondary mt-1">No verified enquiry definition for this entity</div>
              )}
            </div>
          </div>
        ) : (
          <div className="card p-4">
            <p className="text-sm text-text-secondary">
              {ga4Attribution.status === 'loading'
                ? 'Loading…'
                : ga4Attribution.status === 'not-connected'
                  ? 'GA4 is not connected for this campaign’s entities.'
                  : 'Unmapped — add the real GA4 campaign name in Edit Campaign.'}
            </p>
          </div>
        )}
      </div>

      {/* Infinity calls — deterministic only: a call's landing page path
          exactly matching one of this campaign's own Tracking Link landing
          pages. Never a caller phone number or any other personal data —
          aggregate counts only. See getInfinityForCampaign's doc comment. */}
      <div>
        <h3 className="v2-section-title">Calls (Infinity)</h3>
        {infinityData.status === 'available' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4">
              <div className="text-sm text-text-secondary mb-1">Calls</div>
              <div className="text-2xl font-bold">{infinityData.calls}</div>
            </div>
            <div className="card p-4">
              <div className="text-sm text-text-secondary mb-1">Answered</div>
              <div className="text-2xl font-bold">{infinityData.answered}</div>
            </div>
            <div className="card p-4">
              <div className="text-sm text-text-secondary mb-1">Missed</div>
              <div className="text-2xl font-bold">{infinityData.missed}</div>
            </div>
            <div className="card p-4">
              <div className="text-sm text-text-secondary mb-1">Answer Rate</div>
              <div className="text-2xl font-bold">{infinityData.answerRate != null ? `${infinityData.answerRate}%` : '—'}</div>
            </div>
          </div>
        ) : (
          <div className="card p-4">
            <p className="text-sm text-text-secondary">
              {infinityData.status === 'not-connected'
                ? 'Infinity call tracking is not connected.'
                : 'Unmapped — add a Tracking Link with a landing page.'}
            </p>
          </div>
        )}
      </div>

      {/* Tracking links */}
      <div>
        <h3 className="v2-section-title">Tracking Links</h3>
        <div className="border rounded-lg p-6 mb-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <h4 className="text-sm font-semibold text-text-primary mb-4">
            {editingTrackingLink ? 'Edit Tracking Link' : 'Add New Tracking Link'}
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Entity</label>
              <select
                value={trackingLinkForm.entity}
                onChange={(e) => setTrackingLinkForm({ ...trackingLinkForm, entity: e.target.value as Brand })}
                className="input w-full"
              >
                <option value="">Select entity</option>
                {campaign.entities?.map((entity) => (
                  <option key={entity} value={entity}>{BRAND_LABEL[entity]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Link Name</label>
              <input
                type="text"
                value={trackingLinkForm.name}
                onChange={(e) => setTrackingLinkForm({ ...trackingLinkForm, name: e.target.value })}
                className="input w-full"
                placeholder="e.g., Homepage Hero CTA"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Channel</label>
              <input
                type="text"
                value={trackingLinkForm.channel}
                onChange={(e) => setTrackingLinkForm({ ...trackingLinkForm, channel: e.target.value })}
                className="input w-full"
                placeholder="e.g., email, social, display"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Landing Page URL</label>
              <input
                type="text"
                value={trackingLinkForm.landingPage}
                onChange={(e) => setTrackingLinkForm({ ...trackingLinkForm, landingPage: e.target.value })}
                className="input w-full"
                placeholder="e.g., https://example.com/products"
              />
            </div>
            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-semibold text-text-secondary">UTM Parameters</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Source</label>
                  <input
                    type="text"
                    value={trackingLinkForm.utmSource}
                    onChange={(e) => setTrackingLinkForm({ ...trackingLinkForm, utmSource: e.target.value })}
                    className="input w-full"
                    placeholder="e.g., google, linkedin"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Medium</label>
                  <input
                    type="text"
                    value={trackingLinkForm.utmMedium}
                    onChange={(e) => setTrackingLinkForm({ ...trackingLinkForm, utmMedium: e.target.value })}
                    className="input w-full"
                    placeholder="e.g., cpc, email, organic"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Campaign</label>
                  <input
                    type="text"
                    value={trackingLinkForm.utmCampaign}
                    onChange={(e) => setTrackingLinkForm({ ...trackingLinkForm, utmCampaign: e.target.value })}
                    className="input w-full"
                    placeholder="Campaign name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Content (optional)</label>
                  <input
                    type="text"
                    value={trackingLinkForm.utmContent}
                    onChange={(e) => setTrackingLinkForm({ ...trackingLinkForm, utmContent: e.target.value })}
                    className="input w-full"
                    placeholder="Ad variant or content ID"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <button
                onClick={() => {
                  if (!trackingLinkForm.entity || !trackingLinkForm.name || !trackingLinkForm.landingPage) {
                    showToast('Entity, Link Name, and Landing Page are required');
                    return;
                  }
                  const newLink: TrackingLink = {
                    id: editingTrackingLink || `tracking-${nanoid(10)}`,
                    entity: trackingLinkForm.entity as Brand,
                    name: trackingLinkForm.name,
                    channel: trackingLinkForm.channel,
                    landingPage: trackingLinkForm.landingPage,
                    utmSource: trackingLinkForm.utmSource,
                    utmMedium: trackingLinkForm.utmMedium,
                    utmCampaign: trackingLinkForm.utmCampaign,
                    utmContent: trackingLinkForm.utmContent || undefined,
                  };
                  const existing = campaign.trackingLinks || [];
                  const updated = editingTrackingLink
                    ? existing.map((l) => (l.id === editingTrackingLink ? newLink : l))
                    : [...existing, newLink];
                  updateCampaign(campaign.id, { trackingLinks: updated });
                  resetLinkForm();
                  showToast(editingTrackingLink ? '✓ Tracking link updated' : '✓ Tracking link added');
                }}
                className="btn btn-primary flex-1"
              >
                {editingTrackingLink ? 'Update Link' : 'Add Link'}
              </button>
              {editingTrackingLink && (
                <button onClick={resetLinkForm} className="btn btn-secondary flex-1">
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        {trackingLinkForm.landingPage && trackingLinkForm.utmSource && trackingLinkForm.utmMedium && trackingLinkForm.utmCampaign && (
          <div className="border rounded-lg p-6 mb-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <h4 className="text-sm font-semibold text-text-primary mb-4">Full Link Preview</h4>
            {(() => {
              const params = new URLSearchParams({
                utm_source: trackingLinkForm.utmSource,
                utm_medium: trackingLinkForm.utmMedium,
                utm_campaign: trackingLinkForm.utmCampaign,
                ...(trackingLinkForm.utmContent && { utm_content: trackingLinkForm.utmContent }),
              });
              const fullUrl = `${trackingLinkForm.landingPage}${trackingLinkForm.landingPage.includes('?') ? '&' : '?'}${params.toString()}`;
              return (
                <div className="space-y-3">
                  <div className="p-3 rounded" style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)', wordBreak: 'break-all' }}>
                    <p className="text-xs font-mono text-text-primary">{fullUrl}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(fullUrl);
                      showToast('✓ Copied to clipboard');
                    }}
                    className="btn btn-secondary w-full flex items-center justify-center gap-2"
                  >
                    <Copy size={14} />
                    Copy Full URL
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {(campaign.trackingLinks || []).length > 0 ? (
          <div className="border rounded-lg p-6" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <h4 className="text-sm font-semibold text-text-primary mb-4">All Tracking Links</h4>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '1px solid var(--color-border)' }}>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-text-secondary">Entity</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-text-secondary">Name</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-text-secondary">Channel</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-text-secondary">Landing Page</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-text-secondary">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {campaign.trackingLinks?.map((link, idx) => (
                    <tr key={link.id} style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--color-surface)' }}>
                      <td className="px-3 py-3">
                        <span style={{ color: BRAND_COLOR[link.entity], fontWeight: 600 }}>{BRAND_LABEL[link.entity]}</span>
                      </td>
                      <td className="px-3 py-3 text-text-primary font-medium">{link.name}</td>
                      <td className="px-3 py-3 text-text-secondary">{link.channel}</td>
                      <td className="px-3 py-3 text-text-secondary text-xs" style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{link.landingPage}</td>
                      <td className="px-3 py-3 text-center flex gap-2 justify-center">
                        <button
                          onClick={() => {
                            setTrackingLinkForm({
                              entity: link.entity,
                              name: link.name,
                              channel: link.channel,
                              landingPage: link.landingPage,
                              utmSource: link.utmSource,
                              utmMedium: link.utmMedium,
                              utmCampaign: link.utmCampaign,
                              utmContent: link.utmContent || '',
                            });
                            setEditingTrackingLink(link.id);
                          }}
                          className="text-blue-500 hover:text-blue-700"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            const updated = (campaign.trackingLinks || []).filter((l) => l.id !== link.id);
                            updateCampaign(campaign.id, { trackingLinks: updated });
                            showToast('✓ Tracking link deleted');
                          }}
                          className="text-red-500 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="v2-empty-state">No tracking links yet. Add your first one above.</p>
        )}
      </div>
    </div>
  );
}

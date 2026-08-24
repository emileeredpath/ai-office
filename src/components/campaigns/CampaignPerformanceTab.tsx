import { useEffect, useMemo, useState } from 'react';
import { Copy, Edit2, Trash2, Mail } from 'lucide-react';
import { nanoid } from 'nanoid';
import { useAppStore } from '@/store/useAppStore';
import { Campaign, TrackingLink, Brand } from '@/types/index';
import { BRAND_COLOR, BRAND_LABEL } from '@/utils/brandColors';
import { isWave1Campaign } from '@/utils/wave1';
import { getEmailPerformanceForCampaign, resolveEmailDateRange } from '@/utils/emailPerformance';
import { formatDateShort } from '@/utils/dateUtils';

interface CampaignPerformanceTabProps {
  campaign: Campaign;
  updateCampaign: (id: string, updates: Partial<Campaign>) => Promise<void>;
  showToast: (message: string) => void;
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

// Wave 1 (GA4 + Infinity) summary, GA4-by-brand breakdown, recent calls, and
// the full Tracking Links CRUD tool — all moved here from the old panel's
// separate Summary/GA4 Performance/Call Tracking/Tracking Links tabs.
// Tracking links stay directly editable in place, same reasoning as the
// Calendar tab's milestones: this is attribution tooling a marketer
// actively manages, not a one-off record edit.
export function CampaignPerformanceTab({ campaign, updateCampaign, showToast }: CampaignPerformanceTabProps) {
  const wave1Performance = useAppStore((s) => s.wave1Performance);
  const syncWave1Performance = useAppStore((s) => s.syncWave1Performance);
  const syncWave1Calls = useAppStore((s) => s.syncWave1Calls);
  const emailPerformance = useAppStore((s) => s.emailPerformance);
  const syncEmailPerformance = useAppStore((s) => s.syncEmailPerformance);

  useEffect(() => {
    syncWave1Performance();
    syncWave1Calls();
  }, [syncWave1Performance, syncWave1Calls]);

  // Campaign Detail isn't scoped by the global Period selector — a
  // campaign's real sends can predate or outlast any period window, so
  // this always looks across everything currently synced (same "All time"
  // range the Period selector itself uses elsewhere) rather than
  // approximating from the campaign's own start/end dates.
  useEffect(() => {
    const { startDate, endDate } = resolveEmailDateRange('all-time');
    syncEmailPerformance(startDate, endDate);
  }, [syncEmailPerformance]);

  const emailPerf = useMemo(
    () => getEmailPerformanceForCampaign(emailPerformance, campaign.id),
    [emailPerformance, campaign.id]
  );

  const [trackingLinkForm, setTrackingLinkForm] = useState(EMPTY_LINK_FORM);
  const [editingTrackingLink, setEditingTrackingLink] = useState<string | null>(null);

  const wave1Applies = isWave1Campaign(campaign);
  const ga4 = wave1Applies ? wave1Performance?.ga4 : null;
  const infinity = wave1Applies ? wave1Performance?.infinity : null;
  const analyticsConnected = wave1Applies && wave1Performance?.configured;

  const resetLinkForm = () => {
    setTrackingLinkForm(EMPTY_LINK_FORM);
    setEditingTrackingLink(null);
  };

  return (
    <div className="space-y-8">
      {/* Wave 1 / GA4 / Infinity performance summary */}
      <div>
        <h3 className="v2-section-title">Performance Summary</h3>
        {analyticsConnected ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="card p-4">
                <div className="text-sm text-text-secondary mb-1">Total Clicks</div>
                <div className="text-2xl font-bold">{ga4?.clicks ?? 0}</div>
              </div>
              <div className="card p-4">
                <div className="text-sm text-text-secondary mb-1">Form Submissions</div>
                <div className="text-2xl font-bold">{ga4?.formSubmissions ?? 0}</div>
              </div>
              <div className="card p-4">
                <div className="text-sm text-text-secondary mb-1">Total Calls</div>
                <div className="text-2xl font-bold">{infinity?.totalCalls ?? 0}</div>
              </div>
              <div className="card p-4">
                <div className="text-sm text-text-secondary mb-1">Conversion Rate</div>
                <div className="text-2xl font-bold">{ga4?.conversionRate?.toFixed(1) ?? 0}%</div>
              </div>
            </div>
            {wave1Performance?.lastSynced && (
              <p className="text-xs text-text-secondary">Last synced: {new Date(wave1Performance.lastSynced).toLocaleString()}</p>
            )}
          </>
        ) : (
          <div className="card p-4">
            <p className="text-sm text-text-secondary">
              Not connected — GA4 and Infinity call tracking are not configured{wave1Applies ? '' : ' for this campaign'}.
            </p>
          </div>
        )}
      </div>

      {/* GA4 by brand */}
      {ga4?.byBrand && Object.keys(ga4.byBrand).length > 0 && (
        <div>
          <h3 className="v2-section-title">Channel Performance</h3>
          <div className="card p-4">
            <table className="table w-full text-sm">
              <thead>
                <tr>
                  <th>Brand</th>
                  <th className="text-right">Clicks</th>
                  <th className="text-right">Page Views</th>
                  <th className="text-right">Form Subs</th>
                  <th className="text-right">Conv. Rate</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(ga4.byBrand).map(([brand, metrics]) => (
                  <tr key={brand}>
                    <td className="font-medium capitalize">{brand}</td>
                    <td className="text-right">{metrics.clicks}</td>
                    <td className="text-right">{metrics.pageViews}</td>
                    <td className="text-right">{metrics.formSubmissions}</td>
                    <td className="text-right">{metrics.conversionRate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent calls */}
      {infinity?.calls && infinity.calls.length > 0 && (
        <div>
          <h3 className="v2-section-title">Recent Calls</h3>
          <div className="card p-4">
            <table className="table w-full text-sm">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Duration</th>
                  <th>Caller</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {infinity.calls.slice(0, 50).map((call) => (
                  <tr key={call.id}>
                    <td>{call.date}</td>
                    <td>{call.time}</td>
                    <td>{call.duration}</td>
                    <td className="text-text-secondary text-xs">{call.callerNumber}</td>
                    <td>
                      <span className="badge" style={{ background: call.answered ? '#10b981' : '#ef4444', color: 'white', fontSize: '11px' }}>
                        {call.answered ? 'Answered' : 'Missed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-text-secondary mt-2">Showing latest 50 calls</p>
          </div>
        </div>
      )}

      {/* Email Performance — the single source of truth for this campaign's
          send-level email data. Only genuine source: 'campaign-monitor'
          sends whose dashboardCampaignId already matches this campaign
          (set by the existing sync's name-based matching) ever appear here
          — never a fuzzy/similarly-named send. Duplicated Open %/Click %/
          Bounces/Unsubscribes were removed from the Content tab so this is
          the only place those figures come from. */}
      <div>
        <h3 className="v2-section-title">Email Performance</h3>
        {emailPerf.status === 'available' && emailPerf.sends.length > 0 ? (
          <div className="card p-4">
            <div className="overflow-x-auto">
              <table className="table w-full text-sm">
                <thead>
                  <tr>
                    <th>Send Name</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Recipients</th>
                    <th style={{ textAlign: 'right' }}>Opens</th>
                    <th style={{ textAlign: 'right' }}>Clicks</th>
                    <th style={{ textAlign: 'right' }}>Bounces</th>
                    <th style={{ textAlign: 'right' }}>Unsubscribes</th>
                    <th>Campaign Monitor ID</th>
                  </tr>
                </thead>
                <tbody>
                  {emailPerf.sends.map((send) => (
                    <tr key={send.taskId}>
                      <td className="text-text-primary">{send.campaignName}</td>
                      <td className="text-text-secondary">{formatDateShort(send.sentDate)}</td>
                      <td style={{ textAlign: 'right' }}>{send.recipients != null ? send.recipients.toLocaleString() : '—'}</td>
                      <td style={{ textAlign: 'right' }}>{send.opens != null ? send.opens.toLocaleString() : '—'}</td>
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
                {emailPerf.status === 'not-connected' ? 'Campaign Monitor is not connected' : 'No Campaign Monitor sends are linked to this campaign'}
              </p>
              <p className="v2-crm-empty-subtitle">
                {emailPerf.status === 'not-connected'
                  ? 'Email performance will appear here once Campaign Monitor is configured.'
                  : "Sends are linked automatically by the existing Campaign Monitor sync. If a real send for this campaign isn't showing, its name may not have matched — this is never guessed here."}
              </p>
            </div>
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

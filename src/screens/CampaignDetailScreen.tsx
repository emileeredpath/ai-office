import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, MoreHorizontal, FileText, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { BrandBadge } from '@/components/common/BrandBadge';
import { KpiCard } from '@/components/common/KpiCard';
import { EditCampaignModal } from '@/components/campaigns/EditCampaignModal';
import { CampaignCalendarTab } from '@/components/campaigns/CampaignCalendarTab';
import { CampaignPerformanceTab } from '@/components/campaigns/CampaignPerformanceTab';
import { formatDateShort } from '@/utils/dateUtils';
import { getCampaignProgressInfo } from '@/utils/campaignProgress';
import { CAMPAIGN_STATUS_BADGE_STYLE, CAMPAIGN_STATUS_LABEL } from '@/utils/campaignStatus';
import type { AuditLogEntry } from '@/services/auditLogApi';

type DetailTab = 'overview' | 'performance' | 'leads' | 'opportunities' | 'content' | 'calendar' | 'files' | 'notes';

const TABS: { id: DetailTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'performance', label: 'Performance' },
  { id: 'leads', label: 'Leads' },
  { id: 'opportunities', label: 'Opportunities' },
  { id: 'content', label: 'Content' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'files', label: 'Files' },
  { id: 'notes', label: 'Notes' },
];

function describeAuditEntry(entry: AuditLogEntry): string {
  const value = (entry.newValue ?? entry.previousValue) as any;
  const label = value?.title || value?.name || value?.schemeName || entry.resourceId || entry.resourceType;
  const resourceLabel = entry.resourceType.replace(/_/g, ' ');
  const verb = entry.action.startsWith('create')
    ? 'Created'
    : entry.action.startsWith('update')
    ? 'Updated'
    : entry.action.startsWith('complete')
    ? 'Completed'
    : entry.action.startsWith('delete')
    ? 'Archived'
    : 'Changed';
  return `${verb} ${resourceLabel} "${label}"`;
}

interface CampaignDetailScreenProps {
  campaignId: string;
  onBack: () => void;
}

export function CampaignDetailScreen({ campaignId, onBack }: CampaignDetailScreenProps) {
  const campaign = useAppStore((s) => s.campaigns.find((c) => c.id === campaignId));
  const tasks = useAppStore((s) => s.tasks);
  const auditLog = useAppStore((s) => s.auditLog);
  const updateCampaign = useAppStore((s) => s.updateCampaign);
  const deleteCampaign = useAppStore((s) => s.deleteCampaign);
  const syncAuditLog = useAppStore((s) => s.syncAuditLog);

  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);
  const [toastId, setToastId] = useState(0);

  useEffect(() => {
    setActiveTab('overview');
    setShowOverflowMenu(false);
  }, [campaignId]);

  useEffect(() => {
    syncAuditLog();
  }, [syncAuditLog]);

  const showToast = (message: string) => {
    const id = toastId;
    setToastId(id + 1);
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };

  const campaignTasks = useMemo(() => (campaign ? tasks.filter((t) => t.campaignId === campaign.id) : []), [tasks, campaign]);
  const emailSends = useMemo(() => campaignTasks.filter((t) => t.type === 'email-send'), [campaignTasks]);

  const campaignActivity = useMemo(() => {
    if (!campaign) return [];
    const taskIds = new Set(campaignTasks.map((t) => t.id));
    return auditLog.filter((e) => e.resourceId === campaign.id || (e.resourceId && taskIds.has(e.resourceId))).slice(0, 8);
  }, [auditLog, campaign, campaignTasks]);

  const upcomingActivity = useMemo(() => {
    const now = new Date();
    return campaignTasks
      .filter((t) => t.status !== 'complete' && t.deadline && new Date(t.deadline) >= now)
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
      .slice(0, 5);
  }, [campaignTasks]);

  if (!campaign) {
    return (
      <div className="v2-page">
        <p className="text-text-secondary">This campaign could not be found.</p>
        <button onClick={onBack} className="v2-detail-back mt-4">
          <ArrowLeft size={15} /> Back
        </button>
      </div>
    );
  }

  const entities = campaign.entities && campaign.entities.length > 0 ? campaign.entities : [campaign.brand];
  const progress = getCampaignProgressInfo(campaign.status, campaign.startDate, campaign.endDate);
  const recipients = campaign.recipients || emailSends.reduce((sum, t) => sum + (t.recipients || 0), 0);
  const eligibleSpend = campaign.budget || 0;
  const recoverable = campaign.cofundRate != null && campaign.budget ? Math.round((campaign.budget * campaign.cofundRate) / 100) : 0;
  const hasFunding = !!(campaign.vendor || campaign.scheme || campaign.claimStatus);

  const roiValue =
    campaign.valueGenerated != null && campaign.spend > 0
      ? Math.round(((campaign.valueGenerated - campaign.spend) / campaign.spend) * 100)
      : null;

  return (
    <div className="v2-page">
      <div className="max-w-7xl mx-auto">
        <button onClick={onBack} className="v2-detail-back">
          <ArrowLeft size={15} /> Back to campaigns
        </button>

        {/* Header */}
        <div className="v2-detail-header">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{campaign.name}</h1>
            <div className="v2-detail-meta">
              {entities.map((entity) => (
                <BrandBadge key={entity} brand={entity} />
              ))}
              <span className="badge" style={{ ...CAMPAIGN_STATUS_BADGE_STYLE[campaign.status], fontSize: '11px' }}>
                {CAMPAIGN_STATUS_LABEL[campaign.status]}
              </span>
              {(campaign.primaryIndustry || campaign.secondaryIndustry) && (
                <span className="v2-detail-meta-dot">
                  {[campaign.primaryIndustry, campaign.secondaryIndustry].filter(Boolean).join(' · ')}
                </span>
              )}
              <span className="v2-detail-meta-dot">
                {formatDateShort(campaign.startDate)} – {formatDateShort(campaign.endDate)}
              </span>
            </div>
          </div>

          <div className="v2-detail-actions">
            <button onClick={() => setShowEditModal(true)} className="btn btn-primary">
              Edit Campaign
            </button>
            <div className="v2-overflow-wrap">
              <button className="v2-overflow-btn" onClick={() => setShowOverflowMenu((v) => !v)} title="More actions">
                <MoreHorizontal size={18} />
              </button>
              {showOverflowMenu && (
                <div className="v2-overflow-menu">
                  <button
                    className="v2-overflow-item"
                    onClick={() => {
                      setShowOverflowMenu(false);
                      if (window.confirm(`Delete "${campaign.name}"? This cannot be undone.`)) {
                        deleteCampaign(campaign.id);
                        onBack();
                      }
                    }}
                  >
                    Delete campaign
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="v2-progress-wrap">
          <div className="v2-progress-row">
            <span className="font-medium text-text-primary">{progress.percent}% complete</span>
            <span className="text-text-secondary">{progress.label}</span>
          </div>
          <div className="v2-progress-track">
            <div className="v2-progress-fill" style={{ width: `${progress.percent}%` }} />
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-4 xl:grid-cols-7 gap-4 mb-8">
          <KpiCard title="Budget" value={campaign.budget != null ? `£${campaign.budget.toLocaleString()}` : '—'} subtitle="Set on this campaign" />
          <KpiCard title="Spend" value={`£${Math.round(campaign.spend).toLocaleString()}`} subtitle="Manually logged" />
          <KpiCard title="Marketing Leads" value={campaign.leads} subtitle="Manually logged, not CRM-linked" accent="var(--v2-green)" />
          <KpiCard title="Opportunities" status="not-connected" subtitle="Awaiting Acumatica integration" />
          <KpiCard title="Open Pipeline" status="not-connected" subtitle="Awaiting Acumatica integration" />
          <KpiCard title="Won Revenue" status="not-connected" subtitle="Awaiting Acumatica integration" />
          <KpiCard
            title="ROI"
            value={roiValue !== null ? `${roiValue >= 0 ? '+' : ''}${roiValue}%` : undefined}
            status={roiValue !== null ? 'available' : 'not-connected'}
            subtitle={roiValue !== null ? 'Spend vs value generated' : 'No value generated logged yet'}
          />
        </div>

        {/* Tabs */}
        <div className="v2-detail-tabs">
          {TABS.map((tab) => (
            <button key={tab.id} className="v2-detail-tab" data-active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              <div className="card">
                <h3 className="v2-section-title">Campaign Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-text-secondary text-xs mb-1">Theme</div>
                    <div className="text-text-primary">{campaign.theme || '—'}</div>
                  </div>
                  <div>
                    <div className="text-text-secondary text-xs mb-1">Recipients reached</div>
                    <div className="text-text-primary">{recipients.toLocaleString()}</div>
                  </div>
                </div>
                {campaign.notes && (
                  <p className="text-sm text-text-secondary mt-4" style={{ whiteSpace: 'pre-wrap' }}>{campaign.notes}</p>
                )}
              </div>

              <div className="card">
                <h3 className="v2-section-title">Performance Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-text-secondary text-xs mb-1">Enquiries</div>
                    <div className="text-text-primary font-semibold">
                      {campaign.results?.enquiriesReceived != null ? campaign.results.enquiriesReceived : 'Not logged yet'}
                    </div>
                  </div>
                  <div>
                    <div className="text-text-secondary text-xs mb-1">Marketing Leads</div>
                    <div className="text-text-primary font-semibold">{campaign.leads}</div>
                  </div>
                  <div>
                    <div className="text-text-secondary text-xs mb-1">Open Pipeline</div>
                    <div className="text-text-secondary">Not connected</div>
                  </div>
                  <div>
                    <div className="text-text-secondary text-xs mb-1">Won Revenue</div>
                    <div className="text-text-secondary">Not connected</div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="v2-section-title">Recent Campaign Activity</h3>
                {campaignActivity.length > 0 ? (
                  <div className="space-y-3">
                    {campaignActivity.map((entry) => (
                      <div key={entry.id} className="text-sm" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                        <div className="text-text-primary">{describeAuditEntry(entry)}</div>
                        <div className="text-xs text-text-secondary mt-1">{formatDateShort(entry.createdAt)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-secondary">No recent activity for this campaign.</p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="card">
                <h3 className="v2-section-title">Upcoming Activity</h3>
                {upcomingActivity.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingActivity.map((task) => (
                      <div key={task.id} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                        <div className="text-sm font-medium text-text-primary">{task.title}</div>
                        <div className="text-xs text-text-secondary">Due {formatDateShort(task.deadline!)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-secondary">Nothing scheduled.</p>
                )}
              </div>

              <div className="card">
                <h3 className="v2-section-title">Funding Status</h3>
                {hasFunding ? (
                  <div className="space-y-2 text-sm">
                    {campaign.vendor && (
                      <div className="flex justify-between"><span className="text-text-secondary">Vendor</span><span className="text-text-primary font-medium capitalize">{campaign.vendor}</span></div>
                    )}
                    {campaign.scheme && (
                      <div className="flex justify-between"><span className="text-text-secondary">Scheme</span><span className="text-text-primary font-medium">{campaign.scheme}</span></div>
                    )}
                    {campaign.claimStatus && (
                      <div className="flex justify-between"><span className="text-text-secondary">Claim status</span><span className="text-text-primary font-medium capitalize">{campaign.claimStatus}</span></div>
                    )}
                    <div className="flex justify-between"><span className="text-text-secondary">Eligible spend</span><span className="text-text-primary font-medium">£{eligibleSpend.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-text-secondary">Recoverable</span><span className="text-text-primary font-medium">£{recoverable.toLocaleString()}</span></div>
                  </div>
                ) : (
                  <p className="text-sm text-text-secondary">No funding scheme linked to this campaign.</p>
                )}
              </div>

              <div className="card">
                <h3 className="v2-section-title">Tracking & Attribution</h3>
                {(campaign.trackingLinks || []).length > 0 ? (
                  <p className="text-sm text-text-primary">
                    {campaign.trackingLinks!.length} tracking link{campaign.trackingLinks!.length === 1 ? '' : 's'} configured.{' '}
                    <button onClick={() => setActiveTab('performance')} style={{ color: 'var(--v2-purple)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      View in Performance →
                    </button>
                  </p>
                ) : (
                  <p className="text-sm text-text-secondary">No tracking links configured yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: Performance */}
        {activeTab === 'performance' && (
          <CampaignPerformanceTab campaign={campaign} updateCampaign={updateCampaign} showToast={showToast} />
        )}

        {/* TAB: Leads */}
        {activeTab === 'leads' && (
          <div className="card">
            <h3 className="v2-section-title">Marketing Leads</h3>
            <div className="text-3xl font-bold text-text-primary mb-2">{campaign.leads}</div>
            <p className="text-sm text-text-secondary">
              Manually logged against this campaign — not yet linked to Acumatica or any CRM. Update this figure via Edit Campaign.
            </p>
          </div>
        )}

        {/* TAB: Opportunities */}
        {activeTab === 'opportunities' && (
          <div className="card">
            <p className="v2-empty-state">Not connected — awaiting Acumatica integration. No opportunity data exists in AI Office today.</p>
          </div>
        )}

        {/* TAB: Content */}
        {activeTab === 'content' && (
          <div className="card p-0">
            {emailSends.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table w-full text-sm">
                  <thead>
                    <tr>
                      <th>Send Name</th>
                      <th>Date</th>
                      <th style={{ textAlign: 'right' }}>Recipients</th>
                      <th style={{ textAlign: 'right' }}>Open %</th>
                      <th style={{ textAlign: 'right' }}>Click %</th>
                      <th style={{ textAlign: 'right' }}>Bounces</th>
                      <th style={{ textAlign: 'right' }}>Unsubscribes</th>
                      <th style={{ textAlign: 'right' }}>Cost (£)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emailSends.map((task) => (
                      <tr key={task.id}>
                        <td className="text-text-primary">{task.title}</td>
                        <td className="text-text-secondary">{task.deadline ? formatDateShort(task.deadline) : '—'}</td>
                        <td style={{ textAlign: 'right' }}>{task.recipients ? task.recipients.toLocaleString() : '—'}</td>
                        <td style={{ textAlign: 'right' }}>{task.openRate != null ? `${task.openRate.toFixed(1)}%` : '—'}</td>
                        <td style={{ textAlign: 'right' }}>{task.clickRate != null ? `${task.clickRate.toFixed(1)}%` : '—'}</td>
                        <td style={{ textAlign: 'right' }}>{task.bounces != null ? task.bounces.toLocaleString() : '—'}</td>
                        <td style={{ textAlign: 'right' }}>{task.unsubscribes != null ? task.unsubscribes.toLocaleString() : '—'}</td>
                        <td style={{ textAlign: 'right' }}>{task.cost != null ? task.cost.toFixed(2) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="v2-empty-state">No content sends logged for this campaign.</p>
            )}
          </div>
        )}

        {/* TAB: Calendar */}
        {activeTab === 'calendar' && (
          <CampaignCalendarTab
            campaign={campaign}
            campaignTasks={campaignTasks}
            updateCampaign={updateCampaign}
            showToast={showToast}
            onViewPlan={() => setShowPlanModal(true)}
          />
        )}

        {/* TAB: Files */}
        {activeTab === 'files' && (
          <div className="card">
            {campaign.planDocument ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText size={20} color="var(--v2-purple)" />
                  <div>
                    <div className="text-sm font-medium text-text-primary">{campaign.planDocument.filename}</div>
                    <div className="text-xs text-text-secondary">Campaign master plan</div>
                  </div>
                </div>
                <button onClick={() => setShowPlanModal(true)} className="btn btn-secondary text-sm">
                  View
                </button>
              </div>
            ) : (
              <p className="v2-empty-state">No files uploaded yet.</p>
            )}
          </div>
        )}

        {/* TAB: Notes */}
        {activeTab === 'notes' && (
          <div className="card">
            <h3 className="v2-section-title">Campaign Notes</h3>
            <textarea
              defaultValue={campaign.notes}
              onBlur={(e) => {
                if (e.target.value !== campaign.notes) {
                  updateCampaign(campaign.id, { notes: e.target.value });
                  showToast('✓ Notes saved');
                }
              }}
              className="input w-full text-sm"
              rows={10}
              placeholder="Campaign overview, key objectives, wave structure, messaging strategy..."
            />
          </div>
        )}
      </div>

      {showEditModal && <EditCampaignModal campaign={campaign} onClose={() => setShowEditModal(false)} />}

      {showPlanModal && campaign.planDocument && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowPlanModal(false)}
        >
          <div
            style={{ backgroundColor: 'white', borderRadius: '8px', maxWidth: '800px', maxHeight: '80vh', overflow: 'auto', padding: '2rem', width: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-text-primary">{campaign.name} — Master Plan</h2>
              <button onClick={() => setShowPlanModal(false)} className="text-text-secondary hover:text-text-primary">
                <X size={24} />
              </button>
            </div>
            <div className="text-sm text-text-secondary mb-4">{campaign.planDocument.filename}</div>
            <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontFamily: 'inherit', color: 'var(--color-text-primary)' }}>
              {campaign.planDocument.content}
            </pre>
          </div>
        </div>
      )}

      <div style={{ position: 'fixed', bottom: '1rem', right: '1rem', zIndex: 999 }}>
        {toasts.map((toast) => (
          <div key={toast.id} style={{ backgroundColor: '#10b981', color: 'white', padding: '0.75rem 1rem', borderRadius: '4px', marginBottom: '0.5rem', minWidth: '200px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

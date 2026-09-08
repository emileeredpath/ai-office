import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, MoreHorizontal, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { BrandBadge } from '@/components/common/BrandBadge';
import { EditCampaignModal } from '@/components/campaigns/EditCampaignModal';
import { CampaignOverviewTab } from '@/components/campaigns/CampaignOverviewTab';
import { CampaignPerformanceTab } from '@/components/campaigns/CampaignPerformanceTab';
import { CampaignActivityTasksTab } from '@/components/campaigns/CampaignActivityTasksTab';
import { formatDateShort } from '@/utils/dateUtils';
import { getCampaignProgressInfo } from '@/utils/campaignProgress';
import { CAMPAIGN_STATUS_BADGE_STYLE, CAMPAIGN_STATUS_LABEL } from '@/utils/campaignStatus';
import { resolveGoogleAdsDateRange } from '@/utils/googleAdsPerformance';
import { resolveEmailDateRange, getEmailPerformanceForCampaign } from '@/utils/emailPerformance';
import { resolveCallDateRange } from '@/utils/callPerformance';
import { resolveGa4DateRange } from '@/utils/ga4Traffic';
import { getGoogleAdsForCampaign, getInfinityForCampaign } from '@/utils/campaignAttribution';
import { fetchCampaignGa4Attribution, type Ga4CampaignAttribution } from '@/services/ga4Api';
import { CAMPAIGN_PLAN_MARKDOWN } from '@/data/campaignPlans';
import type { Task } from '@/types/index';

// Acumatica commercial data has no per-campaign field anywhere in its
// schema (see the Campaign Detail data-source audit) — only brand/entity
// level figures exist (Leads & CRM, Overview). This is genuinely
// different from "not connected" (Acumatica IS connected, via manual
// import) — never conflate the two states, and never insert an
// entity-level figure here as if it were this campaign's own result.
export const ACUMATICA_NOT_CAMPAIGN_SCOPED =
  'Acumatica manual commercial data is available at entity level, but no deterministic campaign-level relationship exists today.';

export type Ga4AttributionState =
  | { status: 'loading' | 'unmapped' | 'not-connected' }
  | { status: 'available'; sessions: number; users: number; enquiries: number | null };

export type DetailTab = 'overview' | 'performance' | 'activity' | 'content' | 'plan' | 'notes';

const TABS: { id: DetailTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'performance', label: 'Performance' },
  { id: 'activity', label: 'Activity & Tasks' },
  { id: 'content', label: 'Content' },
  { id: 'plan', label: 'Plan & Files' },
  { id: 'notes', label: 'Notes' },
];

// A legacy tab id (from before this simplification) still used by
// selectCampaign(id, tab) deep-links elsewhere in the app — mapped onto
// the new structure so those links keep landing somewhere sensible
// instead of silently falling back to Overview.
const LEGACY_TAB_ALIAS: Record<string, DetailTab> = {
  leads: 'overview',
  opportunities: 'overview',
  calendar: 'activity',
  files: 'plan',
};

function resolveInitialTab(raw: string | undefined | null): DetailTab {
  if (!raw) return 'overview';
  if (TABS.some((t) => t.id === raw)) return raw as DetailTab;
  return LEGACY_TAB_ALIAS[raw] ?? 'overview';
}

interface CampaignDetailScreenProps {
  campaignId: string;
  onBack: () => void;
}

export function CampaignDetailScreen({ campaignId, onBack }: CampaignDetailScreenProps) {
  const campaign = useAppStore((s) => s.campaigns.find((c) => c.id === campaignId));
  const tasks = useAppStore((s) => s.tasks);
  const auditLog = useAppStore((s) => s.auditLog);
  const googleAdsPerformance = useAppStore((s) => s.googleAdsPerformance);
  const syncGoogleAdsPerformance = useAppStore((s) => s.syncGoogleAdsPerformance);
  const emailPerformance = useAppStore((s) => s.emailPerformance);
  const syncEmailPerformance = useAppStore((s) => s.syncEmailPerformance);
  const infinityCalls = useAppStore((s) => s.infinityCalls);
  const syncInfinityCalls = useAppStore((s) => s.syncInfinityCalls);
  const updateCampaign = useAppStore((s) => s.updateCampaign);
  const deleteCampaign = useAppStore((s) => s.deleteCampaign);
  const syncAuditLog = useAppStore((s) => s.syncAuditLog);
  const campaignCosts = useAppStore((s) => s.campaignCosts);
  const syncCampaignCosts = useAppStore((s) => s.syncCampaignCosts);
  const addCampaignCost = useAppStore((s) => s.addCampaignCost);
  const updateCampaignCost = useAppStore((s) => s.updateCampaignCost);
  const deleteCampaignCost = useAppStore((s) => s.deleteCampaignCost);
  // Set (and consumed) via selectCampaign(id, 'calendar') — lets other
  // screens (Content & Calendar) deep-link straight into a specific tab
  // instead of always landing on Overview.
  const selectedCampaignInitialTab = useAppStore((s) => s.selectedCampaignInitialTab);

  const [activeTab, setActiveTab] = useState<DetailTab>(resolveInitialTab(selectedCampaignInitialTab));
  const [showEditModal, setShowEditModal] = useState(false);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);
  const [toastId, setToastId] = useState(0);

  useEffect(() => {
    setActiveTab(resolveInitialTab(selectedCampaignInitialTab));
    setShowOverflowMenu(false);
    // Only re-run when the campaign actually changes, not on every store
    // update — selectedCampaignInitialTab is read once at navigation time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  useEffect(() => {
    syncAuditLog();
  }, [syncAuditLog]);

  useEffect(() => {
    syncCampaignCosts();
  }, [syncCampaignCosts]);

  // ---- Shared attribution fetching — lifted here (rather than each tab
  // fetching its own copy) so switching between Overview and Performance
  // never issues a second, duplicate set of API calls for the same
  // campaign. Every fetch below is deterministic-only: Google Ads by exact
  // campaign.id in googleAdsCampaignIds, GA4 by exact sessionCampaignName
  // in ga4CampaignNames, Infinity by exact landing-page-path match against
  // this campaign's own Tracking Links. Same "all-time" reasoning as
  // before this phase — a campaign's real activity can predate or outlast
  // whatever the global Period selector happens to be set to. ------------
  useEffect(() => {
    const { startDate, endDate } = resolveGoogleAdsDateRange('all-time');
    syncGoogleAdsPerformance(startDate, endDate);
  }, [syncGoogleAdsPerformance]);
  useEffect(() => {
    const { startDate, endDate } = resolveEmailDateRange('all-time');
    syncEmailPerformance(startDate, endDate);
  }, [syncEmailPerformance]);
  useEffect(() => {
    const { startDate, endDate } = resolveCallDateRange('all-time');
    syncInfinityCalls(startDate, endDate);
  }, [syncInfinityCalls]);

  const googleAds = useMemo(
    () => (campaign ? getGoogleAdsForCampaign(googleAdsPerformance, campaign) : null),
    [googleAdsPerformance, campaign]
  );
  const emailPerf = useMemo(
    () => (campaign ? getEmailPerformanceForCampaign(emailPerformance, campaign.id) : null),
    [emailPerformance, campaign]
  );
  const infinityAttribution = useMemo(
    () => (campaign ? getInfinityForCampaign(infinityCalls, campaign) : null),
    [infinityCalls, campaign]
  );

  const ga4CampaignNames = campaign?.ga4CampaignNames ?? [];
  const ga4Brands = campaign?.entities && campaign.entities.length > 0 ? campaign.entities : campaign ? [campaign.brand] : [];
  const [ga4Attribution, setGa4Attribution] = useState<Ga4AttributionState>({ status: 'unmapped' });
  useEffect(() => {
    if (!campaign || ga4CampaignNames.length === 0) {
      setGa4Attribution({ status: 'unmapped' });
      return;
    }
    let cancelled = false;
    setGa4Attribution({ status: 'loading' });
    const { startDate, endDate } = resolveGa4DateRange('all-time');
    Promise.all(ga4Brands.map((brand) => fetchCampaignGa4Attribution(brand, ga4CampaignNames, startDate, endDate).catch(() => null)))
      .then((responses) => {
        if (cancelled) return;
        const results = responses.filter((r): r is NonNullable<typeof r> => r != null && r.result != null).map((r) => r.result as Ga4CampaignAttribution);
        if (results.length === 0) {
          setGa4Attribution({ status: 'not-connected' });
          return;
        }
        const sessions = results.reduce((sum, r) => sum + r.sessions, 0);
        const users = results.reduce((sum, r) => sum + r.users, 0);
        const enquiryResults = results.filter((r) => r.enquiries != null);
        const enquiries = enquiryResults.length > 0 ? enquiryResults.reduce((sum, r) => sum + (r.enquiries ?? 0), 0) : null;
        setGa4Attribution({ status: 'available', sessions, users, enquiries });
      })
      .catch(() => {
        if (!cancelled) setGa4Attribution({ status: 'not-connected' });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign?.id, JSON.stringify(ga4CampaignNames), JSON.stringify(ga4Brands)]);

  const showToast = (message: string) => {
    const id = toastId;
    setToastId(id + 1);
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };

  const campaignTasks = useMemo(() => (campaign ? tasks.filter((t) => t.campaignId === campaign.id) : []), [tasks, campaign]);
  const thisCampaignCosts = useMemo(() => (campaign ? campaignCosts.filter((c) => c.campaignId === campaign.id) : []), [campaignCosts, campaign]);
  const campaignActivity = useMemo(() => {
    if (!campaign) return [];
    const taskIds = new Set(campaignTasks.map((t) => t.id));
    return auditLog.filter((e) => e.resourceId === campaign.id || (e.resourceId && taskIds.has(e.resourceId))).slice(0, 8);
  }, [auditLog, campaign, campaignTasks]);

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

  // Prefer a real uploaded plan (campaign.planDocument, settable via the
  // generic update_campaign MCP path) over the static reference file — the
  // static file exists for a handful of campaigns as a fallback so their
  // original written plan is visible at all, not a live/authoritative copy.
  const staticPlanMarkdown = CAMPAIGN_PLAN_MARKDOWN[campaign.id];
  const hasPlan = !!campaign.planDocument || !!staticPlanMarkdown;

  const entities = campaign.entities && campaign.entities.length > 0 ? campaign.entities : [campaign.brand];
  const progress = getCampaignProgressInfo(campaign.status, campaign.startDate, campaign.endDate);

  // Secondary metadata row — only genuinely-populated fields, never an
  // empty label just to fill space. There is no "Owner" field anywhere in
  // the Campaign data model today, so it's never shown (not even as a
  // blank) rather than inventing a stub.
  const secondaryMeta: { label: string; value: string }[] = [];
  if (campaign.primaryIndustry) secondaryMeta.push({ label: 'Primary industry', value: campaign.primaryIndustry });
  if (campaign.secondaryIndustry) secondaryMeta.push({ label: 'Secondary industry', value: campaign.secondaryIndustry });
  if (campaign.theme) secondaryMeta.push({ label: 'Theme', value: campaign.theme });

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
              {progress.statusInconsistent ? (
                <span className="badge" style={{ background: 'var(--v2-orange)', color: 'white', fontSize: '11px' }}>
                  {CAMPAIGN_STATUS_LABEL[campaign.status]}
                </span>
              ) : (
                <span className="badge" style={{ ...CAMPAIGN_STATUS_BADGE_STYLE[campaign.status], fontSize: '11px' }}>
                  {CAMPAIGN_STATUS_LABEL[campaign.status]}
                </span>
              )}
              <span className="v2-detail-meta-dot">
                {formatDateShort(campaign.startDate)} – {formatDateShort(campaign.endDate)}
              </span>
            </div>
            {progress.statusInconsistent && (
              <p className="text-sm font-semibold" style={{ color: 'var(--v2-orange)', marginTop: '0.4rem' }}>
                {progress.label} — this is not corrected automatically
              </p>
            )}
            {secondaryMeta.length > 0 && (
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-text-secondary" style={{ marginTop: '0.5rem' }}>
                {secondaryMeta.map((m) => (
                  <span key={m.label}>
                    <span style={{ opacity: 0.75 }}>{m.label}:</span> {m.value}
                  </span>
                ))}
              </div>
            )}
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
          <CampaignOverviewTab
            campaign={campaign}
            campaignTasks={campaignTasks}
            campaignActivity={campaignActivity}
            campaignCosts={thisCampaignCosts}
            googleAds={googleAds}
            emailPerf={emailPerf}
            infinityAttribution={infinityAttribution}
            ga4Attribution={ga4Attribution}
            hasPlan={hasPlan}
            onOpenPlan={() => setShowPlanModal(true)}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {/* TAB: Performance */}
        {activeTab === 'performance' && (
          <CampaignPerformanceTab
            campaign={campaign}
            updateCampaign={updateCampaign}
            showToast={showToast}
            googleAds={googleAds}
            emailPerf={emailPerf}
            infinityAttribution={infinityAttribution}
            ga4Attribution={ga4Attribution}
            campaignCosts={thisCampaignCosts}
            addCampaignCost={addCampaignCost}
            updateCampaignCost={updateCampaignCost}
            deleteCampaignCost={deleteCampaignCost}
          />
        )}

        {/* TAB: Activity & Tasks */}
        {activeTab === 'activity' && (
          <CampaignActivityTasksTab
            campaign={campaign}
            campaignTasks={campaignTasks}
            updateCampaign={updateCampaign}
            showToast={showToast}
          />
        )}

        {/* TAB: Content */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            <div>
              <h3 className="v2-section-title">Content Deliverables</h3>
              <p className="text-sm text-text-secondary mb-3">
                Tasks representing content/creative deliverables for this campaign — briefs, pages, assets. Real Campaign
                Monitor send performance (opens, clicks, bounces) lives on the Performance tab, not duplicated here.
              </p>
              <ContentDeliverablesTable campaignTasks={campaignTasks} />
            </div>
          </div>
        )}

        {/* TAB: Plan & Files */}
        {activeTab === 'plan' && (
          <div className="card">
            {hasPlan ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-text-primary">
                    {campaign.planDocument ? campaign.planDocument.filename : 'Campaign Plan'}
                  </div>
                  <div className="text-xs text-text-secondary">
                    {campaign.planDocument ? 'Campaign master plan' : 'Original plan document (reference file)'}
                  </div>
                </div>
                <button onClick={() => setShowPlanModal(true)} className="btn btn-secondary text-sm">
                  View
                </button>
              </div>
            ) : (
              <p className="v2-empty-state">No plan document on file for this campaign.</p>
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

      {showPlanModal && hasPlan && (
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
            {campaign.planDocument && <div className="text-sm text-text-secondary mb-4">{campaign.planDocument.filename}</div>}
            <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontFamily: 'inherit', color: 'var(--color-text-primary)' }}>
              {campaign.planDocument?.content ?? staticPlanMarkdown}
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

// Content tab's deliverable list — genuine campaign tasks only, distinct
// from Performance's full Campaign Monitor send-metrics table. Shows every
// linked task that represents content/creative work (email-send tasks
// included, since those still represent a real content deliverable even
// though their performance numbers live elsewhere).
function ContentDeliverablesTable({ campaignTasks }: { campaignTasks: Task[] }) {
  if (campaignTasks.length === 0) {
    return <p className="v2-empty-state">No content tasks logged for this campaign.</p>;
  }
  return (
    <div className="card p-0 overflow-x-auto">
      <table className="table w-full text-sm">
        <thead>
          <tr>
            <th>Item</th>
            <th>Type</th>
            <th>Status</th>
            <th>Deadline</th>
          </tr>
        </thead>
        <tbody>
          {campaignTasks.map((task) => (
            <tr key={task.id}>
              <td className="text-text-primary">{task.title}</td>
              <td className="text-text-secondary capitalize">{task.type === 'email-send' ? 'Email send' : 'Task'}</td>
              <td className="text-text-secondary capitalize">{task.status.replace(/-/g, ' ')}</td>
              <td className="text-text-secondary">{task.deadline ? formatDateShort(task.deadline) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

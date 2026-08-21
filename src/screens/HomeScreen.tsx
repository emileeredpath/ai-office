import { useEffect, useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Info, ArrowRight, ExternalLink } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/contexts/AuthContext';
import { useEntity } from '@/contexts/EntityContext';
import { usePeriod, periodStartDate } from '@/contexts/PeriodContext';
import { PeriodSelector } from '@/components/common/PeriodSelector';
import { KpiCard } from '@/components/common/KpiCard';
import { MarketingFunnel, type FunnelStage } from '@/components/common/MarketingFunnel';
import { DataFreshnessBar, type FreshnessEntry } from '@/components/common/DataFreshnessBar';
import { BrandBadge } from '@/components/common/BrandBadge';
import { formatDate, formatDateShort, timeAgo } from '@/utils/dateUtils';
import { getCampaignProgressInfo } from '@/utils/campaignProgress';
import { CAMPAIGN_STATUS_BADGE_STYLE, CAMPAIGN_STATUS_LABEL } from '@/utils/campaignStatus';
import { getMarketingEvents } from '@/utils/marketingEvents';
import { filterCampaignsByPeriod, sumLeads, sumSpend, sumEnquiries } from '@/utils/campaignMetrics';
import { getEmailSnapshot, getCallsSnapshot } from '@/utils/channelSnapshot';
import { resolveGa4DateRange, getWebsiteUsers } from '@/utils/ga4Traffic';
import type { AuditLogEntry } from '@/services/auditLogApi';

const MTECH_AI_PROJECT_URL = 'https://claude.ai/project/019ef9de-64f0-75c3-8a1e-67749db5192e';

interface HomeScreenProps {
  onNavigate?: (screen: string) => void;
}

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
    : entry.action.startsWith('restore')
    ? 'Restored'
    : entry.action.startsWith('import')
    ? 'Imported into'
    : entry.action.startsWith('sync')
    ? 'Synced'
    : 'Changed';
  return `${verb} ${resourceLabel} "${label}"`;
}

// Small type chip for Recent Activity, derived from the audit log's own
// resource_type — no new data, just a clearer label on what already exists.
function activityKind(resourceType: string): { kind: string; label: string } {
  if (resourceType === 'task') return { kind: 'task', label: 'Task' };
  if (resourceType === 'campaign') return { kind: 'campaign', label: 'Campaign' };
  if (resourceType === 'funding_record') return { kind: 'funding', label: 'Funding' };
  return { kind: 'other', label: resourceType.replace(/_/g, ' ') };
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const tasks = useAppStore((s) => s.tasks);
  const campaigns = useAppStore((s) => s.campaigns);
  const fundingRecords = useAppStore((s) => s.fundingRecords);
  const auditLog = useAppStore((s) => s.auditLog);
  const wave1Performance = useAppStore((s) => s.wave1Performance);
  const ga4Traffic = useAppStore((s) => s.ga4Traffic);
  const syncFundingRecordsFromApi = useAppStore((s) => s.syncFundingRecordsFromApi);
  const syncAuditLog = useAppStore((s) => s.syncAuditLog);
  const syncWave1Performance = useAppStore((s) => s.syncWave1Performance);
  const syncWave1Calls = useAppStore((s) => s.syncWave1Calls);
  const syncGa4Traffic = useAppStore((s) => s.syncGa4Traffic);
  const selectTask = useAppStore((s) => s.selectTask);
  const selectCampaign = useAppStore((s) => s.selectCampaign);
  const { isEditor } = useAuth();
  const { selectedEntity, isGroupView, matchesSelectedEntity } = useEntity();
  const { period } = usePeriod();

  useEffect(() => {
    syncFundingRecordsFromApi();
    syncAuditLog();
    syncWave1Performance();
    syncWave1Calls();
  }, [syncFundingRecordsFromApi, syncAuditLog, syncWave1Performance, syncWave1Calls]);

  const ga4Range = useMemo(() => resolveGa4DateRange(period), [period]);
  useEffect(() => {
    syncGa4Traffic(ga4Range.startDate, ga4Range.endDate);
  }, [ga4Range.startDate, ga4Range.endDate, syncGa4Traffic]);

  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = formatDate(today);
  const userName = isEditor ? 'Emilee' : 'John';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // ---- Entity + period scoped data ----------------------------------
  const entityCampaigns = useMemo(
    () => campaigns.filter((c) => matchesSelectedEntity(c.brand)),
    [campaigns, selectedEntity] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const entityTasks = useMemo(
    () => tasks.filter((t) => matchesSelectedEntity(t.brand)),
    [tasks, selectedEntity] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const entityFundingRecords = useMemo(
    () => fundingRecords.filter((r) => matchesSelectedEntity(r.brand)),
    [fundingRecords, selectedEntity] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const periodStart = useMemo(() => periodStartDate(period), [period]);
  const periodCampaigns = useMemo(
    () => filterCampaignsByPeriod(entityCampaigns, periodStart),
    [entityCampaigns, periodStart]
  );

  // ---- Headline KPIs (5) — real data only, honest "Not connected" ---
  // Marketing Leads and Marketing Spend come from manually-logged campaign
  // fields (campaignRepository `leads`/`spend`) — real numbers, but not
  // CRM-sourced, so they're labelled accordingly rather than implied to be
  // Acumatica data. Open Pipeline, Won Revenue, Opportunities and Won Deals
  // have no data source in the app today (no CRM/Acumatica integration
  // exists) — they show "Not connected" rather than £0 or an invented figure.
  // Shared with Performance via src/utils/campaignMetrics.ts so the two
  // pages can never disagree on these totals.
  const marketingLeads = useMemo(() => sumLeads(periodCampaigns), [periodCampaigns]);
  const marketingSpend = useMemo(() => sumSpend(periodCampaigns), [periodCampaigns]);
  const liveCampaignsCount = useMemo(() => entityCampaigns.filter((c) => c.status === 'active').length, [entityCampaigns]);

  // ---- Marketing Funnel -----------------------------------------------
  // Website Users: real GA4 activeUsers (Phase 1) — see
  // src/utils/ga4Traffic.ts for how the figure is resolved per entity.
  // Enquiries: real, but manually logged per campaign (CampaignResults),
  // never previously aggregated — this is a genuine improvement using
  // existing data, not an invented number.
  // Opportunities / Won Deals: no CRM data model exists — not connected.
  const enquiriesTotal = useMemo(() => sumEnquiries(periodCampaigns), [periodCampaigns]);
  const websiteUsers = useMemo(
    () => getWebsiteUsers(ga4Traffic, isGroupView, selectedEntity),
    [ga4Traffic, isGroupView, selectedEntity]
  );
  const funnelStages: FunnelStage[] = [
    {
      label: 'Website Users',
      value: websiteUsers.status === 'available' ? websiteUsers.activeUsers! : null,
      subtitle: websiteUsers.subtitle,
    },
    { label: 'Enquiries', value: enquiriesTotal, subtitle: 'Manually logged per campaign' },
    { label: 'Marketing Leads', value: marketingLeads, subtitle: 'Manually logged per campaign' },
    { label: 'Opportunities', value: null, subtitle: 'Awaiting Acumatica integration' },
    { label: 'Won Deals', value: null, subtitle: 'Awaiting Acumatica integration' },
  ];

  // ---- Needs Your Attention --------------------------------------------
  // Real, rule-based triggers only — no invented warnings. Task rules reuse
  // the original HomeScreen logic; the funding-expiry rule uses the same
  // real fundingRecords data already fetched on this screen. Each item
  // carries a short `tag` (what happened) plus `detail` (why it matters) so
  // the list is scannable without reading full sentences.
  type AttentionSeverity = 'red' | 'orange' | 'purple';
  interface AttentionItem {
    id: string;
    tag: string;
    title: string;
    detail: string;
    severity: AttentionSeverity;
    onClick?: () => void;
  }

  const attentionItems = useMemo<AttentionItem[]>(() => {
    const now = new Date();
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const items: AttentionItem[] = [];

    for (const t of entityTasks) {
      if (t.status === 'complete') continue;
      if (t.deadline && new Date(t.deadline) < now) {
        items.push({
          id: `task-overdue-${t.id}`,
          tag: 'Overdue',
          title: t.title,
          detail: `Since ${formatDateShort(t.deadline)} — needs action`,
          severity: 'red',
          onClick: () => selectTask(t.id),
        });
      } else if (t.status === 'waiting-approval' || t.status === 'waiting-john') {
        items.push({
          id: `task-waiting-${t.id}`,
          tag: t.status === 'waiting-approval' ? 'Awaiting approval' : 'Awaiting John',
          title: t.title,
          detail: t.deadline ? `Due ${formatDateShort(t.deadline)}` : 'No deadline set',
          severity: 'orange',
          onClick: () => selectTask(t.id),
        });
      } else if (t.deadline) {
        const d = new Date(t.deadline);
        if (d >= now && d <= in48h) {
          items.push({
            id: `task-due-${t.id}`,
            tag: 'Due soon',
            title: t.title,
            detail: `Due ${formatDateShort(t.deadline)}`,
            severity: 'orange',
            onClick: () => selectTask(t.id),
          });
        }
      }
    }

    const in30days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    for (const r of entityFundingRecords) {
      if (r.archived) continue;
      if (!r.claimDeadline) continue;
      if (r.claimStatus !== 'eligible' && r.claimStatus !== 'submitted') continue;
      const deadline = new Date(r.claimDeadline);
      if (deadline >= now && deadline <= in30days) {
        items.push({
          id: `funding-${r.id}`,
          tag: 'Funding expiring',
          title: `${r.vendor} — ${r.schemeName}`,
          detail: `Claim by ${formatDateShort(r.claimDeadline)}`,
          severity: 'orange',
          onClick: () => onNavigate?.('funding'),
        });
      }
    }

    return items.sort((a, b) => (a.severity === 'red' ? -1 : b.severity === 'red' ? 1 : 0));
  }, [entityTasks, entityFundingRecords, selectTask, onNavigate]);

  // ---- Coming Up ---------------------------------------------------------
  // A short marketing diary, not a task manager: merges real upcoming task
  // deadlines, real campaign milestones (campaign.schedule — previously only
  // visible inside Campaign Detail's Calendar tab), and real funding claim
  // deadlines into one sorted feed. Microsoft To Do deadlines are not wired
  // in yet — Microsoft To Do remains the primary personal task manager.
  // Computation itself is shared with Content & Calendar via
  // src/utils/marketingEvents.ts — this block only maps that shared output
  // to the same three kinds ('task' | 'milestone' | 'funding') and the same
  // click behaviour this section always had, so its rendered output is
  // unchanged (email-send tasks render as 'task' here, exactly as before —
  // Content & Calendar is the only place that distinguishes them).
  type ComingUpKind = 'task' | 'milestone' | 'funding';
  interface ComingUpItem {
    id: string;
    kind: ComingUpKind;
    title: string;
    due: Date;
    context?: string;
    onClick?: () => void;
  }

  const comingUp = useMemo<ComingUpItem[]>(() => {
    const now = new Date();
    const events = getMarketingEvents({
      tasks,
      campaigns,
      fundingRecords,
      matchesSelectedEntity,
      rangeStart: now,
      includeCompleted: false,
      includeCampaignMarkers: false,
    });

    const items: ComingUpItem[] = events.map((e) => ({
      id: e.id,
      kind: e.kind === 'email' ? 'task' : (e.kind as ComingUpKind),
      title: e.title,
      due: e.date,
      // Tasks (including email-sends, which render as plain 'task' here)
      // always showed the linked campaign name as context, never the send
      // stats — matches the original behaviour exactly.
      context: e.kind === 'funding' ? e.subtitle : e.campaignName,
      onClick:
        e.kind === 'funding'
          ? () => onNavigate?.('funding')
          : e.kind === 'milestone'
          ? () => selectCampaign(e.campaignId!)
          : () => selectTask(e.taskId!),
    }));

    return items.slice(0, 6);
  }, [tasks, campaigns, fundingRecords, matchesSelectedEntity, selectTask, selectCampaign, onNavigate]);

  // ---- Active Campaigns (compact) ---------------------------------------
  // Date-based progress, shared with Campaign Detail and the Campaigns
  // table (src/utils/campaignProgress.ts) — same honest formula everywhere.
  const activeCampaignsCompact = useMemo(() => {
    return entityCampaigns
      .filter((c) => c.status === 'active')
      .map((c) => ({ ...c, progress: getCampaignProgressInfo(c.status, c.startDate, c.endDate) }))
      .sort((a, b) => a.progress.percent === b.progress.percent ? 0 : b.progress.percent - a.progress.percent)
      .slice(0, 3);
  }, [entityCampaigns]);

  // ---- Channel Snapshot ---------------------------------------------------
  // Email: derived from real email-send tasks (Campaign Monitor sync writes
  // these) if any exist; otherwise honestly "Not connected". Social and PPC
  // have no real data source at all — the PPC page (rebuilt honestly in a
  // later phase) is itself all "Not connected" today too, awaiting Google
  // Ads. Calls use the real Infinity wave1Performance response when
  // configured. Shared with Performance's Channel Summary via
  // src/utils/channelSnapshot.ts so the two pages can never disagree.
  const emailSnapshot = useMemo(() => getEmailSnapshot(entityTasks), [entityTasks]);
  const callsSnapshot = useMemo(
    () => getCallsSnapshot(campaigns, wave1Performance, matchesSelectedEntity),
    [campaigns, wave1Performance, selectedEntity] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const infinityConfigured = wave1Performance?.infinityConfigured === true;

  // ---- Recent Activity — respect the global entity selector -------------
  // audit_log rows don't carry a brand column directly, so entity-scoping
  // cross-references each entry's resourceId against this entity's real
  // campaigns/tasks/funding records — same pattern as Campaign Detail's
  // "Recent Campaign Activity".
  const visibleActivity = useMemo(() => {
    if (isGroupView) return auditLog.slice(0, 8);
    const ids = new Set<string>();
    entityCampaigns.forEach((c) => ids.add(c.id));
    entityTasks.forEach((t) => ids.add(t.id));
    entityFundingRecords.forEach((r) => ids.add(r.id));
    return auditLog.filter((e) => e.resourceId && ids.has(e.resourceId)).slice(0, 8);
  }, [auditLog, isGroupView, entityCampaigns, entityTasks, entityFundingRecords]);

  // ---- Data freshness -----------------------------------------------------
  // GA4 freshness reflects the general website-traffic source this page
  // actually uses (ga4Traffic), not the separate campaign-scoped Wave 1
  // GA4 query — the two have independent configured/error states and must
  // never be conflated into one misleading "Live"/"Not connected" signal.
  const ga4Configured = ga4Traffic?.configured === true;
  const ga4HasErrors = (ga4Traffic?.errors?.length ?? 0) > 0;
  const campaignMonitorSyncEntry = auditLog.find((e) => e.resourceType === 'campaign_monitor');

  const freshnessEntries: FreshnessEntry[] = [
    ga4Configured
      ? { label: 'GA4', status: ga4HasErrors ? 'error' : 'live', detail: ga4HasErrors ? 'Sync error' : 'Live' }
      : { label: 'GA4', status: 'not-connected', detail: 'Not connected' },
    infinityConfigured
      ? { label: 'Infinity (Calls)', status: (wave1Performance?.infinityErrors?.length ?? 0) > 0 ? 'error' : 'live', detail: (wave1Performance?.infinityErrors?.length ?? 0) > 0 ? 'Sync error' : 'Connected' }
      : { label: 'Infinity (Calls)', status: 'not-connected', detail: 'Not connected' },
    campaignMonitorSyncEntry
      ? { label: 'Campaign Monitor', status: 'live', detail: `Updated ${timeAgo(campaignMonitorSyncEntry.createdAt)}` }
      : { label: 'Campaign Monitor', status: 'not-connected', detail: 'No confirmed sync yet' },
    { label: 'Acumatica', status: 'not-connected', detail: 'Not connected' },
    { label: 'Hootsuite', status: 'not-connected', detail: 'Not connected' },
    { label: 'PPC (Google Ads)', status: 'not-connected', detail: 'Not connected' },
  ];

  const dataUpdatedLabel = 'Live data — synced on page load';

  return (
    <div className="v2-page">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="v2-page-header">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              {getGreeting()}, {userName}
            </h1>
            <p className="text-text-secondary">
              {dayName} {dateStr} · Here's what's happening across {isGroupView ? 'MTech marketing' : 'this entity'} today.
            </p>
          </div>
          <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
            <PeriodSelector />
            <span className="v2-page-updated">{dataUpdatedLabel}</span>
          </div>
        </div>

        <DataFreshnessBar entries={freshnessEntries} />

        {/* Headline KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 xl:gap-6 mb-8">
          <KpiCard title="Marketing Leads" value={marketingLeads} subtitle="Manually logged, not yet CRM-linked" />
          <KpiCard title="Open Pipeline" status="not-connected" subtitle="Awaiting Acumatica integration" />
          <KpiCard title="Won Revenue" status="not-connected" subtitle="Awaiting Acumatica integration" />
          <KpiCard title="Live Campaigns" value={liveCampaignsCount} subtitle={isGroupView ? 'Across all entities' : 'This entity'} accent="var(--v2-green)" />
          <KpiCard
            title="Marketing Spend"
            value={`£${Math.round(marketingSpend).toLocaleString()}`}
            subtitle="Manually logged campaign spend"
            onClick={() => onNavigate?.('campaigns')}
          />
        </div>

        {/* Marketing Funnel + Needs Your Attention + Coming Up */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="card">
            <h2 className="v2-section-title">Marketing Funnel</h2>
            <MarketingFunnel stages={funnelStages} />
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '1.5rem 1.5rem 0.75rem' }}>
              <h2 className="v2-section-title" style={{ marginBottom: 0 }}>
                Needs Your Attention
              </h2>
            </div>
            <div style={{ padding: '0 1.5rem 1.5rem' }}>
              {attentionItems.length > 0 ? (
                <div className="space-y-2">
                  {attentionItems.slice(0, 5).map((item) => (
                    <button
                      key={item.id}
                      onClick={item.onClick}
                      className="v2-attention-item w-full flex items-start gap-2 text-left px-3 py-2 rounded"
                      data-severity={item.severity}
                    >
                      {item.severity === 'red' ? (
                        <AlertTriangle size={14} color="var(--v2-red)" style={{ marginTop: 2, flexShrink: 0 }} />
                      ) : item.severity === 'orange' ? (
                        <AlertTriangle size={14} color="var(--v2-orange)" style={{ marginTop: 2, flexShrink: 0 }} />
                      ) : (
                        <Info size={14} color="var(--v2-purple)" style={{ marginTop: 2, flexShrink: 0 }} />
                      )}
                      <span style={{ flex: 1 }}>
                        <span className="flex items-center gap-2">
                          <span
                            className="text-xs font-bold"
                            style={{ color: item.severity === 'red' ? 'var(--v2-red)' : item.severity === 'orange' ? 'var(--v2-orange)' : 'var(--v2-purple)' }}
                          >
                            {item.tag}
                          </span>
                        </span>
                        <span className="text-sm font-medium text-text-primary block">{item.title}</span>
                        <span className="text-xs text-text-secondary">{item.detail}</span>
                      </span>
                    </button>
                  ))}
                  {attentionItems.length > 5 && (
                    <div className="text-xs text-text-secondary" style={{ paddingTop: 4 }}>
                      +{attentionItems.length - 5} more
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} color="var(--v2-green)" />
                  <span className="text-sm font-medium text-text-primary">Nothing urgent right now</span>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="v2-section-title">Coming Up</h2>
            {comingUp.length > 0 ? (
              <div className="space-y-3">
                {comingUp.map((item) => (
                  <button
                    key={item.id}
                    onClick={item.onClick}
                    className="w-full text-left"
                    style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', background: 'none', border: 'none', cursor: item.onClick ? 'pointer' : 'default' }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="v2-coming-up-kind" data-kind={item.kind}>
                        {item.kind === 'task' ? 'Task' : item.kind === 'milestone' ? 'Milestone' : 'Funding'}
                      </span>
                      <span className="text-xs text-text-secondary">{formatDateShort(item.due)}</span>
                    </div>
                    <div className="text-sm font-medium text-text-primary">{item.title}</div>
                    {item.context && <div className="text-xs text-text-secondary">{item.context}</div>}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-text-secondary text-sm">Nothing scheduled</p>
            )}
            <p className="text-xs text-text-secondary" style={{ marginTop: '0.75rem' }}>
              Microsoft To Do deadlines are not connected yet.
            </p>
          </div>
        </div>

        {/* Active Campaigns + Recent Activity */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="v2-section-title" style={{ marginBottom: 0 }}>
                Active Campaigns
              </h2>
              <button
                onClick={() => onNavigate?.('campaigns')}
                className="text-sm font-medium flex items-center gap-1"
                style={{ color: 'var(--v2-purple)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                View all campaigns <ArrowRight size={14} />
              </button>
            </div>
            {activeCampaignsCompact.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activeCampaignsCompact.map((c) => (
                  <div key={c.id} className="card v2-mini-campaign-card" onClick={() => selectCampaign(c.id)}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-text-primary text-sm" style={{ lineHeight: 1.3 }}>{c.name}</div>
                      <span className="badge" style={{ ...CAMPAIGN_STATUS_BADGE_STYLE[c.status], fontSize: '10px', flexShrink: 0 }}>
                        {CAMPAIGN_STATUS_LABEL[c.status]}
                      </span>
                    </div>
                    <div className="mt-1">
                      <BrandBadge brand={c.brand} />
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="v2-progress-mini-track" style={{ width: 60 }}>
                        <span
                          className="v2-progress-mini-fill"
                          style={{ width: `${c.progress.percent}%`, display: 'block', backgroundColor: c.progress.statusInconsistent ? 'var(--v2-orange)' : undefined }}
                        />
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: c.progress.statusInconsistent ? 'var(--v2-orange)' : 'var(--color-text-secondary)', fontWeight: c.progress.statusInconsistent ? 600 : 400 }}
                      >
                        {c.progress.percent}% · {c.progress.label}
                      </span>
                    </div>
                    <div className="v2-mini-campaign-stats">
                      <div>
                        <div className="v2-mini-campaign-stat-label">Marketing Leads</div>
                        <div className="v2-mini-campaign-stat-value">{c.leads}</div>
                      </div>
                      <div>
                        <div className="v2-mini-campaign-stat-label">Spend / Budget</div>
                        <div className="v2-mini-campaign-stat-value">
                          £{Math.round(c.spend).toLocaleString()}{c.budget != null ? ` / £${c.budget.toLocaleString()}` : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-secondary">No active campaigns{isGroupView ? '' : ' for this entity'}</p>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 className="v2-section-title">Recent Activity</h2>
            <div className="card" style={{ flex: 1 }}>
              {visibleActivity.length > 0 ? (
                <div className="space-y-3">
                  {visibleActivity.map((entry) => {
                    const { kind, label } = activityKind(entry.resourceType);
                    return (
                      <div key={entry.id} className="text-sm" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="v2-coming-up-kind" data-kind={kind}>{label}</span>
                          <span className="text-xs text-text-secondary">{formatDateShort(entry.createdAt)}</span>
                        </div>
                        <div className="text-text-primary">{describeAuditEntry(entry)}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-text-secondary text-sm">No recent activity{isGroupView ? '' : ' for this entity'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Channel Snapshot */}
        <div className="mb-8">
          <h2 className="v2-section-title">Channel Snapshot (This Period)</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            <KpiCard
              title="Website"
              value={websiteUsers.status === 'available' ? `${websiteUsers.activeUsers} users` : undefined}
              status={websiteUsers.status}
              subtitle={websiteUsers.subtitle}
              size="compact"
            />
            {emailSnapshot ? (
              <KpiCard
                title="Email"
                value={emailSnapshot.hasOpenData ? `${emailSnapshot.opens} opens` : `${emailSnapshot.sends} sends logged`}
                subtitle={
                  emailSnapshot.hasOpenData
                    ? `${emailSnapshot.sends} sends logged · ${emailSnapshot.hasClickData ? `${emailSnapshot.clicks} clicks` : 'click data unavailable'}`
                    : 'Open/click data unavailable for these sends'
                }
                size="compact"
              />
            ) : (
              <KpiCard title="Email" status="not-connected" subtitle="No Campaign Monitor sends logged" size="compact" />
            )}
            <KpiCard title="Social" status="not-connected" subtitle="No integration configured" size="compact" />
            <KpiCard title="PPC" status="not-connected" subtitle="Awaiting Google Ads integration" onClick={() => onNavigate?.('ppc')} size="compact" />
            {callsSnapshot ? (
              <KpiCard title="Calls" value={callsSnapshot.totalCalls} subtitle={`${callsSnapshot.answeredCalls} answered`} onClick={() => onNavigate?.('infinity')} size="compact" />
            ) : (
              <KpiCard title="Calls" status="not-connected" subtitle="Awaiting Infinity integration" onClick={() => onNavigate?.('infinity')} size="compact" />
            )}
          </div>
        </div>

        {/* MTech AI Quick Access — preserved from the previous Home screen */}
        <div className="mb-4">
          <div className="rounded-lg p-5 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #0D1B2A, #1A3A5C)' }}>
            <div>
              <h3 className="text-base font-semibold text-white mb-1">Get AI Help</h3>
              <p className="text-sm text-white opacity-75">Generate prompts for any marketing task using MTech AI</p>
            </div>
            <button
              onClick={() => window.open(MTECH_AI_PROJECT_URL, '_blank')}
              className="flex items-center gap-2 whitespace-nowrap text-white font-medium px-5 py-3 rounded-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--v2-purple)' }}
            >
              Open MTech AI
              <ExternalLink size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

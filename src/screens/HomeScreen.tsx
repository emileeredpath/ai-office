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
import { formatDate, formatDateShort } from '@/utils/dateUtils';
import { CampaignStatus } from '@/types/index';
import type { AuditLogEntry } from '@/services/auditLogApi';

const MTECH_AI_PROJECT_URL = 'https://claude.ai/project/019ef9de-64f0-75c3-8a1e-67749db5192e';

interface HomeScreenProps {
  onNavigate?: (screen: string) => void;
}

const STATUS_BADGE_STYLE: Record<CampaignStatus, { background: string; color: string }> = {
  active: { background: '#10b981', color: 'white' },
  completed: { background: '#9ca3af', color: 'white' },
  planning: { background: '#3b82f6', color: 'white' },
  'on-hold': { background: '#f59e0b', color: 'white' },
};

const STATUS_LABEL: Record<CampaignStatus, string> = {
  active: 'Active',
  completed: 'Completed',
  planning: 'Planning',
  'on-hold': 'On Hold',
};

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

function timeAgo(iso: string | undefined): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const diffMs = Date.now() - then;
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const tasks = useAppStore((s) => s.tasks);
  const campaigns = useAppStore((s) => s.campaigns);
  const fundingRecords = useAppStore((s) => s.fundingRecords);
  const auditLog = useAppStore((s) => s.auditLog);
  const wave1Performance = useAppStore((s) => s.wave1Performance);
  const syncFundingRecordsFromApi = useAppStore((s) => s.syncFundingRecordsFromApi);
  const syncAuditLog = useAppStore((s) => s.syncAuditLog);
  const syncWave1Performance = useAppStore((s) => s.syncWave1Performance);
  const syncWave1Calls = useAppStore((s) => s.syncWave1Calls);
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
  const periodCampaigns = useMemo(() => {
    if (!periodStart) return entityCampaigns;
    return entityCampaigns.filter((c) => c.startDate >= periodStart || c.endDate >= periodStart);
  }, [entityCampaigns, periodStart]);

  // ---- Headline KPIs (5) — real data only, honest "Not connected" ---
  // Marketing Leads and Marketing Spend come from manually-logged campaign
  // fields (campaignRepository `leads`/`spend`) — real numbers, but not
  // CRM-sourced, so they're labelled accordingly rather than implied to be
  // Acumatica data. Open Pipeline, Won Revenue, Opportunities and Won Deals
  // have no data source in the app today (no CRM/Acumatica integration
  // exists) — they show "Not connected" rather than £0 or an invented figure.
  const marketingLeads = useMemo(() => periodCampaigns.reduce((sum, c) => sum + (c.leads || 0), 0), [periodCampaigns]);
  const marketingSpend = useMemo(() => periodCampaigns.reduce((sum, c) => sum + (c.spend || 0), 0), [periodCampaigns]);
  const liveCampaignsCount = useMemo(() => entityCampaigns.filter((c) => c.status === 'active').length, [entityCampaigns]);

  // ---- Marketing Funnel -----------------------------------------------
  // Website Visits: GA4 general traffic is unconfigured in this environment
  // (no frontend consumer of /api/analytics/ga4 either) — not connected.
  // Enquiries: real, but manually logged per campaign (CampaignResults),
  // never previously aggregated — this is a genuine improvement using
  // existing data, not an invented number.
  // Opportunities / Won Deals: no CRM data model exists — not connected.
  const enquiriesTotal = useMemo(
    () => periodCampaigns.reduce((sum, c) => sum + (c.results?.enquiriesReceived || 0), 0),
    [periodCampaigns]
  );
  const funnelStages: FunnelStage[] = [
    { label: 'Website Visits', value: null, subtitle: 'Awaiting GA4 integration' },
    { label: 'Enquiries', value: enquiriesTotal, subtitle: 'Manually logged per campaign' },
    { label: 'Marketing Leads', value: marketingLeads, subtitle: 'Manually logged per campaign' },
    { label: 'Opportunities', value: null, subtitle: 'Awaiting Acumatica integration' },
    { label: 'Won Deals', value: null, subtitle: 'Awaiting Acumatica integration' },
  ];

  // ---- Needs Your Attention --------------------------------------------
  // Real, rule-based triggers only — no invented warnings. Task rules reuse
  // the original HomeScreen logic; the funding-expiry rule is new but uses
  // the same real fundingRecords data already fetched on this screen.
  type AttentionSeverity = 'red' | 'orange' | 'purple';
  interface AttentionItem {
    id: string;
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
          title: t.title,
          detail: `Overdue since ${formatDateShort(t.deadline)}`,
          severity: 'red',
          onClick: () => selectTask(t.id),
        });
      } else if (t.status === 'waiting-approval' || t.status === 'waiting-john') {
        items.push({
          id: `task-waiting-${t.id}`,
          title: t.title,
          detail: t.status === 'waiting-approval' ? 'Waiting approval' : 'Waiting for John',
          severity: 'orange',
          onClick: () => selectTask(t.id),
        });
      } else if (t.deadline) {
        const d = new Date(t.deadline);
        if (d >= now && d <= in48h) {
          items.push({
            id: `task-due-${t.id}`,
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
          title: `${r.vendor} — ${r.schemeName}`,
          detail: `Funding claim deadline ${formatDateShort(r.claimDeadline)}`,
          severity: 'orange',
          onClick: () => onNavigate?.('funding'),
        });
      }
    }

    return items.sort((a, b) => (a.severity === 'red' ? -1 : b.severity === 'red' ? 1 : 0));
  }, [entityTasks, entityFundingRecords, selectTask, onNavigate]);

  // ---- Coming Up ---------------------------------------------------------
  // Real upcoming task deadlines only. Microsoft To Do deadlines are not
  // wired in — Microsoft To Do remains the primary personal task manager,
  // per product direction; this section is deliberately not a task manager.
  const comingUp = useMemo(() => {
    const now = new Date();
    return entityTasks
      .filter((t) => t.status !== 'complete' && t.deadline && new Date(t.deadline) >= now)
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
      .slice(0, 5)
      .map((t) => {
        const campaign = campaigns.find((c) => c.id === t.campaignId);
        return { id: t.id, title: t.title, due: t.deadline!, campaignName: campaign?.name };
      });
  }, [entityTasks, campaigns]);

  // ---- Active Campaigns table ------------------------------------------
  const activeCampaignsTable = useMemo(() => {
    return entityCampaigns
      .filter((c) => c.status === 'active')
      .map((c) => {
        const campaignTasks = tasks.filter((t) => t.campaignId === c.id);
        const total = campaignTasks.length;
        const complete = campaignTasks.filter((t) => t.status === 'complete').length;
        const upcoming = campaignTasks
          .filter((t) => t.deadline && t.status !== 'complete')
          .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())[0];
        return {
          id: c.id,
          name: c.name,
          brand: c.brand,
          status: c.status,
          progress: total > 0 ? Math.round((complete / total) * 100) : null,
          leads: c.leads || 0,
          spend: c.spend || 0,
          due: upcoming?.deadline ?? null,
        };
      })
      .slice(0, 6);
  }, [entityCampaigns, tasks]);

  // ---- Channel Snapshot ---------------------------------------------------
  // Email: derived from real email-send tasks (Campaign Monitor sync writes
  // these) if any exist; otherwise honestly "Not connected". Social and PPC
  // have no real data source at all (PPC screen is confirmed mock data — see
  // Phase 1A instructions — never surfaced here). Calls use the real
  // Infinity wave1Performance response when configured.
  const emailSendTasks = useMemo(() => entityTasks.filter((t) => t.type === 'email-send'), [entityTasks]);
  const emailSnapshot = useMemo(() => {
    if (emailSendTasks.length === 0) return null;
    const totalOpens = emailSendTasks.reduce((sum, t) => sum + (t.opens || 0), 0);
    const totalClicks = emailSendTasks.reduce((sum, t) => sum + (t.clicks || 0), 0);
    return { sends: emailSendTasks.length, opens: totalOpens, clicks: totalClicks };
  }, [emailSendTasks]);

  const infinityConfigured = wave1Performance?.infinityConfigured === true;
  const callsSnapshot =
    infinityConfigured && wave1Performance?.infinity ? wave1Performance.infinity : null;

  // ---- Data freshness -----------------------------------------------------
  const ga4Configured = wave1Performance?.configured === true;
  const ga4HasErrors = (wave1Performance?.errors?.length ?? 0) > 0;
  const campaignMonitorSyncEntry = auditLog.find((e) => e.resourceType === 'campaign_monitor');

  const freshnessEntries: FreshnessEntry[] = [
    ga4Configured
      ? { label: 'GA4', status: ga4HasErrors ? 'error' : 'live', detail: ga4HasErrors ? 'Sync error' : `Updated ${timeAgo(wave1Performance?.lastSynced)}` }
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

  const dataUpdatedLabel = ga4Configured && wave1Performance?.lastSynced ? `Data updated ${timeAgo(wave1Performance.lastSynced)}` : 'Live data — synced on page load';

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
        <div className="grid grid-cols-5 gap-6 mb-8">
          <KpiCard title="Marketing Leads" value={marketingLeads} subtitle="Manually logged, not yet CRM-linked" />
          <KpiCard title="Open Pipeline" status="not-connected" subtitle="Awaiting Acumatica integration" />
          <KpiCard title="Won Revenue" status="not-connected" subtitle="Awaiting Acumatica integration" />
          <KpiCard title="Live Campaigns" value={liveCampaignsCount} subtitle={isGroupView ? 'Across all entities' : 'This entity'} accent="var(--v2-green)" />
          <KpiCard
            title="Marketing Spend"
            value={`£${Math.round(marketingSpend).toLocaleString()}`}
            subtitle="From campaign budgets"
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
                      style={{ border: '1px solid transparent' }}
                    >
                      {item.severity === 'red' ? (
                        <AlertTriangle size={14} color="var(--v2-red)" style={{ marginTop: 2, flexShrink: 0 }} />
                      ) : item.severity === 'orange' ? (
                        <AlertTriangle size={14} color="var(--v2-orange)" style={{ marginTop: 2, flexShrink: 0 }} />
                      ) : (
                        <Info size={14} color="var(--v2-purple)" style={{ marginTop: 2, flexShrink: 0 }} />
                      )}
                      <span style={{ flex: 1 }}>
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
                  <div key={item.id} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                    <div className="text-sm font-medium text-text-primary">{item.title}</div>
                    <div className="text-xs text-text-secondary">
                      Due {formatDateShort(item.due)}
                      {item.campaignName ? ` · ${item.campaignName}` : ''}
                    </div>
                  </div>
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
            {activeCampaignsTable.length > 0 ? (
              <div className="card p-0" style={{ overflow: 'auto' }}>
                <table className="table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Campaign</th>
                      <th>Entity</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Progress</th>
                      <th style={{ textAlign: 'right' }}>Leads</th>
                      <th style={{ textAlign: 'right' }}>Spend</th>
                      <th>Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeCampaignsTable.map((c) => (
                      <tr key={c.id} onClick={() => selectCampaign(c.id)} style={{ cursor: 'pointer' }}>
                        <td className="font-medium text-text-primary">{c.name}</td>
                        <td>
                          <BrandBadge brand={c.brand} />
                        </td>
                        <td>
                          <span className="badge" style={{ ...STATUS_BADGE_STYLE[c.status], fontSize: '11px' }}>
                            {STATUS_LABEL[c.status]}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>{c.progress !== null ? `${c.progress}%` : '—'}</td>
                        <td style={{ textAlign: 'right' }}>{c.leads}</td>
                        <td style={{ textAlign: 'right' }}>£{Math.round(c.spend).toLocaleString()}</td>
                        <td className="text-sm text-text-secondary">{c.due ? formatDateShort(c.due) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-text-secondary">No active campaigns{isGroupView ? '' : ' for this entity'}</p>
            )}
          </div>

          <div>
            <h2 className="v2-section-title">Recent Activity</h2>
            <div className="card">
              {auditLog.length > 0 ? (
                <div className="space-y-3">
                  {auditLog.slice(0, 8).map((entry) => (
                    <div key={entry.id} className="text-sm" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                      <div className="text-text-primary">{describeAuditEntry(entry)}</div>
                      <div className="text-xs text-text-secondary mt-1">{formatDateShort(entry.createdAt)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-secondary text-sm">No recent activity</p>
              )}
            </div>
          </div>
        </div>

        {/* Channel Snapshot */}
        <div className="mb-8">
          <h2 className="v2-section-title">Channel Snapshot (This Period)</h2>
          <div className="grid grid-cols-4 gap-6">
            <KpiCard title="Website" status="not-connected" subtitle="Awaiting GA4 integration" />
            {emailSnapshot ? (
              <KpiCard
                title="Email"
                value={`${emailSnapshot.opens} opens`}
                subtitle={`${emailSnapshot.sends} sends logged · ${emailSnapshot.clicks} clicks`}
              />
            ) : (
              <KpiCard title="Email" status="not-connected" subtitle="No Campaign Monitor sends logged" />
            )}
            <KpiCard title="PPC" status="not-connected" subtitle="Awaiting Google Ads integration" />
            {callsSnapshot ? (
              <KpiCard title="Calls" value={callsSnapshot.totalCalls} subtitle={`${callsSnapshot.answeredCalls} answered`} onClick={() => onNavigate?.('infinity')} />
            ) : (
              <KpiCard title="Calls" status="not-connected" subtitle="Awaiting Infinity integration" />
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

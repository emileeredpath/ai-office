import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Campaign, Task, CampaignCost } from '@/types/index';
import { KpiCard } from '@/components/common/KpiCard';
import { formatDateShort } from '@/utils/dateUtils';
import { getCampaignProgressInfo } from '@/utils/campaignProgress';
import type { CampaignGoogleAdsAttribution, CampaignInfinityAttribution } from '@/utils/campaignAttribution';
import type { CampaignEmailPerformanceInfo } from '@/utils/emailPerformance';
import type { AuditLogEntry } from '@/services/auditLogApi';
import type { DetailTab, Ga4AttributionState } from '@/screens/CampaignDetailScreen';
import { ACUMATICA_NOT_CAMPAIGN_SCOPED } from '@/screens/CampaignDetailScreen';
import { getKnownCampaignSpend } from '@/utils/campaignCosts';

interface CampaignOverviewTabProps {
  campaign: Campaign;
  campaignTasks: Task[];
  campaignActivity: AuditLogEntry[];
  campaignCosts: CampaignCost[];
  googleAds: CampaignGoogleAdsAttribution | null;
  emailPerf: CampaignEmailPerformanceInfo | null;
  infinityAttribution: CampaignInfinityAttribution | null;
  ga4Attribution: Ga4AttributionState;
  hasPlan: boolean;
  onOpenPlan: () => void;
  onNavigateTab: (tab: DetailTab) => void;
}

// Three genuinely distinct states — never collapsed into one "—" or "0":
// a real 0 (mapped, measured, genuinely zero), Unmapped (source exists but
// this campaign has no mapping configured yet), and Not available (the
// system structurally cannot provide this at campaign level — Acumatica).
type ChannelState = 'available' | 'unmapped' | 'not-connected';

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

export function CampaignOverviewTab({
  campaign,
  campaignTasks,
  campaignActivity,
  campaignCosts,
  googleAds,
  emailPerf,
  infinityAttribution,
  ga4Attribution,
  hasPlan,
  onOpenPlan,
  onNavigateTab,
}: CampaignOverviewTabProps) {
  const selectTask = useAppStore((s) => s.selectTask);

  const progress = getCampaignProgressInfo(campaign.status, campaign.startDate, campaign.endDate);
  const { fixedCosts, mediaSpend, mediaSpendStatus, knownCampaignSpend } = getKnownCampaignSpend(campaignCosts, campaign.id, googleAds);

  // ---- Normalised channel states, shared by 3C/3D/3E so they can never
  // disagree about whether a channel is mapped/unmapped/not-connected. ---
  const googleAdsState: ChannelState = googleAds?.status ?? 'not-connected';
  const ga4State: ChannelState = ga4Attribution.status === 'available' ? 'available' : ga4Attribution.status === 'loading' ? 'unmapped' : ga4Attribution.status;
  const infinityState: ChannelState = infinityAttribution?.status ?? 'not-connected';
  // Email Performance's util only distinguishes 'available' (CM configured,
  // 0+ sends found) from 'not-connected' (CM not configured at all) — the
  // "no sends matched yet" case is derived here as Unmapped, matching the
  // same three-state vocabulary as every other channel.
  const emailState: ChannelState =
    emailPerf == null || emailPerf.status === 'not-connected' ? 'not-connected' : emailPerf.sends.length > 0 ? 'available' : 'unmapped';

  // ---- 3A. Campaign Snapshot — identity fields only, never duplicating
  // what's already in the header (entities/dates/status) or the KPI strip
  // (budget/spend). ---------------------------------------------------
  const snapshotFields: { label: string; value: string }[] = [];
  if (campaign.theme) snapshotFields.push({ label: 'Objective / theme', value: campaign.theme });
  const audience = [campaign.primaryIndustry, campaign.secondaryIndustry].filter(Boolean).join(' · ');
  if (audience) snapshotFields.push({ label: 'Audience / industry', value: audience });

  // ---- 3B. Needs Attention / Next Actions — genuine rules only. --------
  interface ActionItem {
    id: string;
    text: string;
    severity: 'red' | 'orange';
    cta?: { label: string; onClick: () => void };
  }
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const overdueTasks = campaignTasks.filter((t) => t.status !== 'complete' && t.deadline && new Date(t.deadline) < now);
  const dueSoonTasks = campaignTasks.filter((t) => t.status !== 'complete' && t.deadline && new Date(t.deadline) >= now && new Date(t.deadline) <= in7Days);

  const actionItems: ActionItem[] = [];
  if (progress.statusInconsistent) {
    actionItems.push({
      id: 'ended-active',
      text: `Campaign ended on ${formatDateShort(campaign.endDate)} but is still Active`,
      severity: 'red',
    });
  }
  if (campaign.budget != null && knownCampaignSpend > campaign.budget) {
    actionItems.push({
      id: 'over-budget',
      text: `Known campaign spend (£${Math.round(knownCampaignSpend).toLocaleString()}) exceeds budget (£${campaign.budget.toLocaleString()})`,
      severity: 'red',
    });
  }
  if (overdueTasks.length > 0) {
    actionItems.push({
      id: 'overdue-tasks',
      text: `${overdueTasks.length} linked task${overdueTasks.length === 1 ? '' : 's'} overdue`,
      severity: 'red',
      cta: { label: 'Open tasks', onClick: () => onNavigateTab('activity') },
    });
  }
  if (dueSoonTasks.length > 0) {
    actionItems.push({
      id: 'due-soon-tasks',
      text: `${dueSoonTasks.length} linked task${dueSoonTasks.length === 1 ? '' : 's'} due within 7 days`,
      severity: 'orange',
      cta: { label: 'Open tasks', onClick: () => onNavigateTab('activity') },
    });
  }
  if (ga4State === 'unmapped') {
    actionItems.push({
      id: 'ga4-unmapped',
      text: 'GA4 campaign name not mapped',
      severity: 'orange',
      cta: { label: 'View performance', onClick: () => onNavigateTab('performance') },
    });
  }
  if (infinityState === 'unmapped') {
    actionItems.push({
      id: 'infinity-unmapped',
      text: 'No tracking link added for Infinity call attribution',
      severity: 'orange',
      cta: { label: 'Add tracking link', onClick: () => onNavigateTab('performance') },
    });
  }
  if (emailState === 'unmapped') {
    actionItems.push({
      id: 'email-unmapped',
      text: 'No Campaign Monitor sends matched to this campaign yet',
      severity: 'orange',
    });
  }
  if (!hasPlan) {
    actionItems.push({ id: 'no-plan', text: 'No campaign plan on file', severity: 'orange' });
  }

  // ---- 3G. Activity & Tasks preview -------------------------------------
  const upcomingTasks = useMemo(
    () =>
      campaignTasks
        .filter((t) => t.status !== 'complete' && t.deadline && new Date(t.deadline) >= now)
        .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
        .slice(0, 4),
    [campaignTasks] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 space-y-6">
        {/* 3B. Needs Attention / Next Actions */}
        <div className="card">
          <h3 className="v2-section-title">Needs Attention / Next Actions</h3>
          {actionItems.length > 0 ? (
            <div className="space-y-2">
              {actionItems.map((item) => (
                <div
                  key={item.id}
                  className="v2-attention-item flex items-start justify-between gap-3 px-3 py-2 rounded"
                  data-severity={item.severity}
                >
                  <span className="text-sm text-text-primary">{item.text}</span>
                  {item.cta && (
                    <button
                      onClick={item.cta.onClick}
                      className="text-xs font-medium whitespace-nowrap"
                      style={{ color: 'var(--v2-purple)', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      {item.cta.label} →
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">Nothing needs attention right now.</p>
          )}
        </div>

        {/* 3C. KPI strip */}
        <div>
          <h3 className="v2-section-title">Key Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <KpiCard title="Budget" value={campaign.budget != null ? `£${campaign.budget.toLocaleString()}` : undefined} status={campaign.budget != null ? 'available' : 'not-connected'} notConnectedLabel="Not set" subtitle="Set on this campaign" size="compact" />
            <KpiCard title="Fixed Costs" value={`£${Math.round(fixedCosts).toLocaleString()}`} subtitle="Manually logged" size="compact" />
            <KpiCard
              title="Media Spend"
              value={mediaSpendStatus === 'available' ? `£${mediaSpend.toLocaleString('en-GB', { maximumFractionDigits: 2 })}` : undefined}
              status={mediaSpendStatus === 'available' ? 'available' : 'not-connected'}
              notConnectedLabel={mediaSpendStatus === 'unmapped' ? 'Unmapped' : 'Not connected'}
              subtitle="Source: Google Ads"
              size="compact"
            />
            <KpiCard
              title="Known Campaign Spend"
              value={`£${Math.round(knownCampaignSpend).toLocaleString()}`}
              subtitle="Fixed costs + connected media spend"
              size="compact"
            />
            <KpiCard
              title="Website Response"
              value={ga4State === 'available' && ga4Attribution.status === 'available' ? `${ga4Attribution.sessions} sessions` : undefined}
              status={ga4State === 'available' ? 'available' : 'not-connected'}
              notConnectedLabel={ga4State === 'unmapped' ? 'Unmapped' : 'Not connected'}
              subtitle="Source: GA4"
              size="compact"
            />
            <KpiCard
              title="Email Response"
              value={emailState === 'available' ? `${emailPerf!.sends.reduce((s, t) => s + (t.clicks ?? 0), 0)} clicks` : undefined}
              status={emailState === 'available' ? 'available' : 'not-connected'}
              notConnectedLabel={emailState === 'unmapped' ? 'Unmapped' : 'Not connected'}
              subtitle="Source: Campaign Monitor"
              size="compact"
            />
            <KpiCard
              title="Calls"
              value={infinityState === 'available' ? infinityAttribution!.calls : undefined}
              status={infinityState === 'available' ? 'available' : 'not-connected'}
              notConnectedLabel={infinityState === 'unmapped' ? 'Unmapped' : 'Not connected'}
              subtitle="Source: Infinity"
              size="compact"
            />
          </div>
        </div>

        {/* 3D. Channel Performance Summary */}
        <div>
          <h3 className="v2-section-title">Channel Performance</h3>
          <div className="card p-0 overflow-x-auto">
            <table className="table w-full text-sm">
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Mapping</th>
                  <th>Metric(s)</th>
                  <th>Source</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-text-primary font-medium">Google Ads</td>
                  <td>
                    <MappingBadge state={googleAdsState} />
                  </td>
                  <td className="text-text-secondary">
                    {googleAdsState === 'available'
                      ? `£${googleAds!.spend.toLocaleString('en-GB', { maximumFractionDigits: 2 })} spend · ${googleAds!.clicks} clicks · ${googleAds!.conversions.toLocaleString('en-GB', { maximumFractionDigits: 2 })} conversions`
                      : googleAdsState === 'unmapped'
                        ? 'No Google Ads campaign ID mapped'
                        : 'Google Ads not connected'}
                  </td>
                  <td className="text-text-secondary text-xs">Google Ads</td>
                  <td>
                    <button onClick={() => onNavigateTab('performance')} className="text-xs font-medium" style={{ color: 'var(--v2-purple)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      View →
                    </button>
                  </td>
                </tr>
                <tr>
                  <td className="text-text-primary font-medium">Website / GA4</td>
                  <td>
                    <MappingBadge state={ga4State} />
                  </td>
                  <td className="text-text-secondary">
                    {ga4State === 'available' && ga4Attribution.status === 'available'
                      ? `${ga4Attribution.sessions} sessions · ${ga4Attribution.users} users${ga4Attribution.enquiries != null ? ` · ${ga4Attribution.enquiries} GA4 Enquiries` : ''}`
                      : ga4State === 'unmapped'
                        ? 'Add the real GA4 campaign name in Edit Campaign'
                        : 'GA4 not connected'}
                  </td>
                  <td className="text-text-secondary text-xs">GA4</td>
                  <td>
                    <button onClick={() => onNavigateTab('performance')} className="text-xs font-medium" style={{ color: 'var(--v2-purple)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      View →
                    </button>
                  </td>
                </tr>
                <tr>
                  <td className="text-text-primary font-medium">Calls / Infinity</td>
                  <td>
                    <MappingBadge state={infinityState} />
                  </td>
                  <td className="text-text-secondary">
                    {infinityState === 'available'
                      ? `${infinityAttribution!.calls} calls · ${infinityAttribution!.answered} answered${infinityAttribution!.answerRate != null ? ` · ${infinityAttribution!.answerRate}% answer rate` : ''}`
                      : infinityState === 'unmapped'
                        ? 'Add a Tracking Link with a landing page'
                        : 'Infinity not connected'}
                  </td>
                  <td className="text-text-secondary text-xs">Infinity</td>
                  <td>
                    <button onClick={() => onNavigateTab('performance')} className="text-xs font-medium" style={{ color: 'var(--v2-purple)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      View →
                    </button>
                  </td>
                </tr>
                <tr>
                  <td className="text-text-primary font-medium">Campaign Monitor</td>
                  <td>
                    <MappingBadge state={emailState} />
                  </td>
                  <td className="text-text-secondary">
                    {emailState === 'available'
                      ? `${emailPerf!.sends.length} send(s) · ${emailPerf!.sends.reduce((s, t) => s + (t.recipients ?? 0), 0).toLocaleString()} recipients · ${emailPerf!.sends.reduce((s, t) => s + (t.clicks ?? 0), 0)} clicks`
                      : emailState === 'unmapped'
                        ? 'No sends matched to this campaign yet'
                        : 'Campaign Monitor not connected'}
                  </td>
                  <td className="text-text-secondary text-xs">Campaign Monitor</td>
                  <td>
                    <button onClick={() => onNavigateTab('performance')} className="text-xs font-medium" style={{ color: 'var(--v2-purple)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      View →
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 3E. Campaign Journey */}
        <div>
          <h3 className="v2-section-title">Campaign Journey</h3>
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-3">Marketing Activity / Response</h4>
                <div className="grid grid-cols-2 gap-3">
                  <JourneyStat label="Fixed Costs" value={`£${Math.round(fixedCosts).toLocaleString()}`} />
                  <JourneyStat label="Media Spend" value={mediaSpendStatus === 'available' ? `£${mediaSpend.toLocaleString('en-GB', { maximumFractionDigits: 2 })}` : mediaSpendStatus === 'unmapped' ? 'Unmapped' : 'Not connected'} />
                  <JourneyStat label="Known Campaign Spend" value={`£${Math.round(knownCampaignSpend).toLocaleString()}`} />
                  <JourneyStat label="Email Response" value={emailState === 'available' ? `${emailPerf!.sends.reduce((s, t) => s + (t.clicks ?? 0), 0)} clicks` : emailState === 'unmapped' ? 'Unmapped' : 'Not connected'} />
                  <JourneyStat label="Website Response" value={ga4State === 'available' && ga4Attribution.status === 'available' ? `${ga4Attribution.sessions} sessions` : ga4State === 'unmapped' ? 'Unmapped' : 'Not connected'} />
                  <JourneyStat label="Calls" value={infinityState === 'available' ? `${infinityAttribution!.calls}` : infinityState === 'unmapped' ? 'Unmapped' : 'Not connected'} />
                </div>
              </div>
              <div style={{ borderLeft: '1px solid var(--color-border)', paddingLeft: '1.5rem' }}>
                <h4 className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-3">Commercial Outcome</h4>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <JourneyStat label="Opportunities" value="Not available" />
                  <JourneyStat label="Open Pipeline" value="Not available" />
                  <JourneyStat label="Won Revenue" value="Not available" />
                </div>
                <p className="text-xs text-text-secondary">
                  Campaign-level Acumatica attribution is not available yet. Entity-level commercial figures are available in
                  Leads & CRM.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* 3A. Campaign Snapshot */}
        {snapshotFields.length > 0 && (
          <div className="card">
            <h3 className="v2-section-title">Campaign Snapshot</h3>
            <div className="space-y-3 text-sm">
              {snapshotFields.map((f) => (
                <div key={f.label}>
                  <div className="text-text-secondary text-xs mb-1">{f.label}</div>
                  <div className="text-text-primary">{f.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3F. Campaign Plan */}
        <div className="card">
          <h3 className="v2-section-title">Campaign Plan</h3>
          {hasPlan ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-primary">Plan available</span>
              <button onClick={onOpenPlan} className="text-sm font-medium" style={{ color: 'var(--v2-purple)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Open plan →
              </button>
            </div>
          ) : (
            <p className="text-sm text-text-secondary">No plan document on file.</p>
          )}
        </div>

        {/* 3G. Activity & Tasks preview */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="v2-section-title" style={{ marginBottom: 0 }}>Next Actions / Activity</h3>
          </div>
          {upcomingTasks.length > 0 ? (
            <div className="space-y-3">
              {upcomingTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => selectTask(task.id)}
                  className="w-full text-left"
                  style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <div className="text-sm font-medium text-text-primary">{task.title}</div>
                  <div className="text-xs text-text-secondary">Due {formatDateShort(task.deadline!)}</div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">Nothing scheduled.</p>
          )}
          <button
            onClick={() => onNavigateTab('activity')}
            className="text-xs font-medium"
            style={{ color: 'var(--v2-purple)', background: 'none', border: 'none', cursor: 'pointer', marginTop: '0.75rem' }}
          >
            View all activity & tasks →
          </button>
        </div>

        {campaignActivity.length > 0 && (
          <div className="card">
            <h3 className="v2-section-title">Recent Campaign Activity</h3>
            <div className="space-y-3">
              {campaignActivity.slice(0, 4).map((entry) => (
                <div key={entry.id} className="text-sm" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                  <div className="text-text-primary">{describeAuditEntry(entry)}</div>
                  <div className="text-xs text-text-secondary mt-1">{formatDateShort(entry.createdAt)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MappingBadge({ state }: { state: ChannelState }) {
  const label = state === 'available' ? 'Mapped' : state === 'unmapped' ? 'Unmapped' : 'Not connected';
  const color = state === 'available' ? 'var(--v2-green)' : state === 'unmapped' ? 'var(--v2-orange)' : 'var(--v2-grey)';
  return (
    <span className="badge" style={{ background: color, color: 'white', fontSize: '11px' }}>
      {label}
    </span>
  );
}

function JourneyStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-text-secondary mb-1">{label}</div>
      <div className="text-sm font-semibold text-text-primary">{value}</div>
    </div>
  );
}

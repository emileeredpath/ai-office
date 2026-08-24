import type { EntitySelection } from '@/contexts/EntityContext';
import type { Period } from '@/contexts/PeriodContext';
import { periodStartDate } from '@/contexts/PeriodContext';
import type { EmailCampaignRecord, EmailPerformanceResponse } from '@/services/emailPerformanceApi';
import { GROUP_AGGREGATE_BRANDS } from '@/utils/groupEntities';

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// A long-past sentinel for "All time" — unlike GA4 Phase 1's floor (the
// GA4 Data API's own documented earliest supported date), Campaign Monitor
// has no equivalent honest floor to cite: the sync has only ever pulled
// rolling windows (see syncCampaignMonitor's sinceDays), so "All time" here
// genuinely means "everything currently synced," not "complete Campaign
// Monitor history." The subtitle text below says so explicitly — this date
// is just old enough to never itself become the limiting factor.
const ALL_TIME_SENTINEL = '2000-01-01';

export function resolveEmailDateRange(period: Period, now: Date = new Date()): { startDate: string; endDate: string } {
  const start = periodStartDate(period, now);
  return {
    startDate: start ? toIsoDate(start) : ALL_TIME_SENTINEL,
    endDate: toIsoDate(now),
  };
}

export interface EmailPerformanceInfo {
  status: 'available' | 'not-connected';
  campaignsSent?: number;
  recipients?: number;
  opens?: number;
  clicks?: number;
  bounces?: number;
  unsubscribes?: number;
  subtitle: string;
}

function sumField(campaigns: EmailPerformanceResponse['campaigns'], field: 'recipients' | 'opens' | 'clicks' | 'bounces' | 'unsubscribes'): number {
  return campaigns.reduce((sum, c) => sum + (c[field] ?? 0), 0);
}

// Single shared source of truth for "what does real email performance mean
// for the current entity selection" — used identically by Overview,
// Performance, and Reports so they can never disagree. Only ever reads
// campaigns the backend has already restricted to source ===
// 'campaign-monitor' (see backend/src/services/emailPerformance.ts) — this
// function never needs to filter seed/test rows itself because they can't
// reach it in the first place.
export function getEmailPerformance(
  data: EmailPerformanceResponse | null,
  isGroupView: boolean,
  selectedEntity: EntitySelection
): EmailPerformanceInfo {
  if (!data || !data.configured) {
    return { status: 'not-connected', subtitle: 'Awaiting Campaign Monitor integration' };
  }

  const relevant = isGroupView
    ? data.campaigns.filter((c) => GROUP_AGGREGATE_BRANDS.includes(c.brand))
    : data.campaigns.filter((c) => c.brand === selectedEntity);

  const campaignsSent = relevant.length;
  const recipients = sumField(relevant, 'recipients');
  const opens = sumField(relevant, 'opens');
  const clicks = sumField(relevant, 'clicks');
  const bounces = sumField(relevant, 'bounces');
  const unsubscribes = sumField(relevant, 'unsubscribes');

  const subtitle =
    campaignsSent === 0
      ? 'No Campaign Monitor sends genuinely attributed in this period'
      : isGroupView
        ? `${campaignsSent} real Campaign Monitor send(s) across Brentwood, Radio Links, Capcom, Irish Radio`
        : `${campaignsSent} real Campaign Monitor send(s) for this entity`;

  return { status: 'available', campaignsSent, recipients, opens, clicks, bounces, unsubscribes, subtitle };
}

export interface CampaignEmailPerformanceInfo {
  status: 'available' | 'not-connected';
  sends: EmailCampaignRecord[];
  subtitle: string;
}

// Send-level view for Campaign Detail → Performance — the single source of
// truth for that page. Trusts only the dashboardCampaignId the existing
// sync already persisted (task.campaignId, set by its name-based
// matching); never fuzzy-matches or infers a link here. A campaign with
// genuinely zero linked sends is a real, honest empty state — never
// backfilled with similarly-named sends.
export function getEmailPerformanceForCampaign(
  data: EmailPerformanceResponse | null,
  dashboardCampaignId: string
): CampaignEmailPerformanceInfo {
  if (!data || !data.configured) {
    return { status: 'not-connected', sends: [], subtitle: 'Awaiting Campaign Monitor integration' };
  }

  const sends = data.campaigns
    .filter((c) => c.dashboardCampaignId === dashboardCampaignId)
    .sort((a, b) => (a.sentDate < b.sentDate ? 1 : -1));

  return {
    status: 'available',
    sends,
    subtitle:
      sends.length > 0
        ? `${sends.length} real Campaign Monitor send(s) linked to this campaign`
        : 'No Campaign Monitor sends are linked to this campaign',
  };
}

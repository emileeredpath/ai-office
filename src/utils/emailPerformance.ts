import type { EntitySelection } from '@/contexts/EntityContext';
import type { Period } from '@/contexts/PeriodContext';
import { periodStartDate } from '@/contexts/PeriodContext';
import type { EmailCampaignRecord, EmailPerformanceResponse } from '@/services/emailPerformanceApi';
import { GROUP_AGGREGATE_BRANDS } from '@/utils/groupEntities';

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Display-only rounding for every email performance percentage (Delivery
// Rate, Unique Open Rate, Click Rate, CTOR, Bounce Rate, Unsubscribe
// Rate). The underlying values themselves stay full-precision floats
// wherever they're stored or summed (see educationCampaign.ts's
// buildRollupRow) — this only formats what's rendered.
export function formatPercent(value: number | null | undefined): string {
  return value != null ? `${value.toFixed(1)}%` : '—';
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

export interface EmailHeadlineMetrics {
  status: 'available' | 'not-connected';
  campaignsSent?: number;
  recipients?: number;
  delivered?: number;
  deliveryRate?: number | null;
  uniqueOpens?: number;
  uniqueOpenRate?: number | null;
  clicks?: number;
  clickRate?: number | null;
  clickToOpenRate?: number | null;
  bounces?: number;
  bounceRate?: number | null;
  unsubscribes?: number;
  unsubscribeRate?: number | null;
  subtitle: string;
}

function sumOf(sends: EmailCampaignRecord[], field: keyof EmailCampaignRecord): number {
  return sends.reduce((sum, s) => sum + ((s[field] as number | null) ?? 0), 0);
}

// Email page headline metrics — every rate here is computed from the
// summed real totals across the relevant sends, never by averaging each
// send's own percentage (averaging percentages misweights a small send
// the same as a huge one). "MTech Group" here uses the same
// GROUP_AGGREGATE_BRANDS scope as getEmailPerformance() above, so this
// page's headline figures can never disagree with Overview/Performance/
// Reports' existing "Email" totals — see getEducationRollup in
// educationCampaign.ts for the one deliberate, documented exception to
// this scope (the Education roll-up itself).
export function getEmailHeadlineMetrics(
  data: EmailPerformanceResponse | null,
  isGroupView: boolean,
  selectedEntity: EntitySelection
): EmailHeadlineMetrics {
  if (!data || !data.configured) {
    return { status: 'not-connected', subtitle: 'Awaiting Campaign Monitor integration' };
  }

  const relevant = isGroupView
    ? data.campaigns.filter((c) => GROUP_AGGREGATE_BRANDS.includes(c.brand))
    : data.campaigns.filter((c) => c.brand === selectedEntity);

  const campaignsSent = relevant.length;
  if (campaignsSent === 0) {
    return { status: 'not-connected', subtitle: 'No Campaign Monitor sends genuinely attributed in this period' };
  }

  const recipients = sumOf(relevant, 'recipients');
  const delivered = sumOf(relevant, 'delivered');
  const uniqueOpens = sumOf(relevant, 'uniqueOpens');
  const clicks = sumOf(relevant, 'clicks');
  const bounces = sumOf(relevant, 'bounces');
  const unsubscribes = sumOf(relevant, 'unsubscribes');

  const subtitle = isGroupView
    ? `${campaignsSent} real Campaign Monitor send(s) across Brentwood, Radio Links, Capcom, Irish Radio`
    : `${campaignsSent} real Campaign Monitor send(s) for this entity`;

  return {
    status: 'available',
    campaignsSent,
    recipients,
    delivered,
    deliveryRate: recipients > 0 ? Math.round((delivered / recipients) * 1000) / 10 : null,
    uniqueOpens,
    uniqueOpenRate: recipients > 0 ? Math.round((uniqueOpens / recipients) * 1000) / 10 : null,
    clicks,
    clickRate: recipients > 0 ? Math.round((clicks / recipients) * 1000) / 10 : null,
    clickToOpenRate: uniqueOpens > 0 ? Math.round((clicks / uniqueOpens) * 1000) / 10 : null,
    bounces,
    bounceRate: recipients > 0 ? Math.round((bounces / recipients) * 1000) / 10 : null,
    unsubscribes,
    unsubscribeRate: recipients > 0 ? Math.round((unsubscribes / recipients) * 1000) / 10 : null,
    subtitle,
  };
}

export interface EmailSendsInfo {
  status: 'available' | 'not-connected';
  sends: EmailCampaignRecord[];
  subtitle: string;
}

// The individual-send table's data source — same MTech Group scope as
// getEmailHeadlineMetrics above, so the table and the headline KPIs above
// it always agree on which sends are "in view."
export function getEmailSends(
  data: EmailPerformanceResponse | null,
  isGroupView: boolean,
  selectedEntity: EntitySelection
): EmailSendsInfo {
  if (!data || !data.configured) {
    return { status: 'not-connected', sends: [], subtitle: 'Awaiting Campaign Monitor integration' };
  }
  const sends = (isGroupView
    ? data.campaigns.filter((c) => GROUP_AGGREGATE_BRANDS.includes(c.brand))
    : data.campaigns.filter((c) => c.brand === selectedEntity)
  ).sort((a, b) => (a.sentDate < b.sentDate ? 1 : -1));

  return {
    status: 'available',
    sends,
    subtitle: sends.length > 0 ? `${sends.length} real Campaign Monitor send(s)` : 'No Campaign Monitor sends genuinely attributed in this period',
  };
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

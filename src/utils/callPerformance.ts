import type { Brand } from '@/types/index';
import type { EntitySelection } from '@/contexts/EntityContext';
import type { Period } from '@/contexts/PeriodContext';
import { periodStartDate } from '@/contexts/PeriodContext';
import type { InfinityCallRecord, InfinityCallsResponse } from '@/services/infinityCallsApi';
import { GROUP_AGGREGATE_BRANDS } from '@/utils/groupEntities';

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Same "All time" honesty as Campaign Monitor's resolveEmailDateRange —
// Infinity has no documented earliest-supported-date to cite, so "All
// time" means everything currently reachable from the account, not a
// claim of complete history.
const ALL_TIME_SENTINEL = '2000-01-01';

export function resolveCallDateRange(period: Period, now: Date = new Date()): { startDate: string; endDate: string } {
  const start = periodStartDate(period, now);
  return {
    startDate: start ? toIsoDate(start) : ALL_TIME_SENTINEL,
    endDate: toIsoDate(now),
  };
}

// Confirmed against real Infinity responses: a call reaching the "bridge"
// stage is genuinely answered/connected. callState is a hangup-reason
// code, not an answered signal, and is not used here — see infinity.ts.
export function isAnswered(call: InfinityCallRecord): boolean {
  return call.callStage === 'bridge';
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
}

export interface CallPerformanceInfo {
  status: 'available' | 'not-connected';
  totalCalls?: number;
  answeredCalls?: number;
  missedCalls?: number;
  avgDuration?: string;
  calls?: InfinityCallRecord[];
  subtitle: string;
}

function summarize(calls: InfinityCallRecord[], subtitle: string): CallPerformanceInfo {
  const answered = calls.filter(isAnswered);
  const answeredCalls = answered.length;
  const missedCalls = calls.length - answeredCalls;
  // Average Call Duration = connected/talk time (bridgeDuration), averaged
  // across answered calls only — a missed call has no connected duration
  // to average in.
  const bridgeDurations = answered.map((c) => c.bridgeDuration ?? 0);
  const avgSeconds =
    bridgeDurations.length > 0 ? Math.round(bridgeDurations.reduce((a, b) => a + b, 0) / bridgeDurations.length) : 0;
  return {
    status: 'available',
    totalCalls: calls.length,
    answeredCalls,
    missedCalls,
    avgDuration: formatDuration(avgSeconds),
    calls,
    subtitle,
  };
}

interface RelevantCalls {
  status: 'available' | 'not-connected';
  calls: InfinityCallRecord[];
  subtitle: string;
}

// Shared entity/period-scoped call selection — every Call Tracking figure
// (headline totals, source breakdown, top landing pages, PPC-assisted
// count) derives from this exact same filter, so none of them can ever
// disagree about which calls are "in scope" for the current selection.
// Only entities with a confirmed real dgrpName mapping (see infinity.ts)
// ever show real figures; everything else — including MTech Group until
// at least one entity is mapped — is an honest "not connected"/"not
// confirmed" state, never a guess.
function getRelevantCalls(
  data: InfinityCallsResponse | null,
  isGroupView: boolean,
  selectedEntity: EntitySelection
): RelevantCalls {
  if (!data || !data.configured) {
    return { status: 'not-connected', calls: [], subtitle: 'Awaiting Infinity integration' };
  }

  if (!isGroupView) {
    const brand = selectedEntity as Brand;
    if (!data.mappedBrands.includes(brand)) {
      return { status: 'not-connected', calls: [], subtitle: 'Entity-level call attribution not confirmed yet' };
    }
    const relevant = data.calls.filter((c) => c.brand === brand);
    return {
      status: 'available',
      calls: relevant,
      subtitle: relevant.length > 0 ? 'Real Infinity calls for this entity' : 'No Infinity calls for this entity in this period',
    };
  }

  const mappedGroupBrands = data.mappedBrands.filter((b) => GROUP_AGGREGATE_BRANDS.includes(b));
  if (mappedGroupBrands.length === 0) {
    return { status: 'not-connected', calls: [], subtitle: 'No entities have confirmed Infinity call attribution yet' };
  }
  const relevant = data.calls.filter((c) => c.brand && GROUP_AGGREGATE_BRANDS.includes(c.brand));
  return {
    status: 'available',
    calls: relevant,
    subtitle: `Combined real Infinity calls across ${mappedGroupBrands.length} of ${GROUP_AGGREGATE_BRANDS.length} entities with confirmed attribution`,
  };
}

// Single shared source of truth for "what does real call performance mean
// for the current entity selection" — used by the Call Tracking page (and
// any future consumer) so they can never disagree.
export function getCallPerformance(
  data: InfinityCallsResponse | null,
  isGroupView: boolean,
  selectedEntity: EntitySelection
): CallPerformanceInfo {
  const { status, calls, subtitle } = getRelevantCalls(data, isGroupView, selectedEntity);
  if (status === 'not-connected') return { status, subtitle };
  return summarize(calls, subtitle);
}

// Confirmed real chType values only — 'ppc'/'seo'/'direct'/'ref' — per the
// Infinity Phase 2 audit. Any other value, including blank/missing, is
// genuinely Unclassified. Never bucketed as Direct — an unknown source is
// not the same claim as a confirmed direct visit.
const CHTYPE_TO_SOURCE: Record<string, string> = {
  ppc: 'Paid Search',
  seo: 'Organic Search',
  direct: 'Direct',
  ref: 'Referral',
};
const UNCLASSIFIED_SOURCE = 'Unclassified';
const SOURCE_ORDER = ['Paid Search', 'Organic Search', 'Direct', 'Referral', UNCLASSIFIED_SOURCE];

export interface CallSourceBucket {
  source: string;
  calls: number;
  answered: number;
  missed: number;
  answerRate: number | null;
}

export interface CallSourceBreakdown {
  status: 'available' | 'not-connected';
  buckets: CallSourceBucket[];
  subtitle: string;
}

export function getCallSourceBreakdown(
  data: InfinityCallsResponse | null,
  isGroupView: boolean,
  selectedEntity: EntitySelection
): CallSourceBreakdown {
  const { status, calls, subtitle } = getRelevantCalls(data, isGroupView, selectedEntity);
  if (status === 'not-connected') return { status, buckets: [], subtitle };

  const groups = new Map<string, InfinityCallRecord[]>();
  for (const call of calls) {
    const source = (call.chType && CHTYPE_TO_SOURCE[call.chType]) || UNCLASSIFIED_SOURCE;
    const bucket = groups.get(source) ?? [];
    bucket.push(call);
    groups.set(source, bucket);
  }

  const buckets: CallSourceBucket[] = SOURCE_ORDER.filter((source) => groups.has(source)).map((source) => {
    const bucketCalls = groups.get(source)!;
    const answered = bucketCalls.filter(isAnswered).length;
    return {
      source,
      calls: bucketCalls.length,
      answered,
      missed: bucketCalls.length - answered,
      answerRate: bucketCalls.length > 0 ? Math.round((answered / bucketCalls.length) * 100) : null,
    };
  });

  return { status: 'available', buckets, subtitle };
}

export interface LandingPageRow {
  url: string;
  label: string;
  calls: number;
  answered: number;
  missed: number;
  answerRate: number | null;
}

export interface TopLandingPages {
  status: 'available' | 'not-connected';
  rows: LandingPageRow[];
  subtitle: string;
}

// Grouped by the real landingPageUrl only — pageTitle is used purely as a
// friendlier display label for whichever URL it was seen on, never as the
// grouping key. A call with no landingPageUrl is real data but has no
// page to group into, so it's excluded from this specific view rather
// than invented into an "Unknown page" row — it's still counted in every
// other Call Tracking figure.
export function getTopLandingPages(
  data: InfinityCallsResponse | null,
  isGroupView: boolean,
  selectedEntity: EntitySelection,
  limit = 10
): TopLandingPages {
  const { status, calls, subtitle } = getRelevantCalls(data, isGroupView, selectedEntity);
  if (status === 'not-connected') return { status, rows: [], subtitle };

  const groups = new Map<string, InfinityCallRecord[]>();
  for (const call of calls) {
    if (!call.landingPageUrl) continue;
    const bucket = groups.get(call.landingPageUrl) ?? [];
    bucket.push(call);
    groups.set(call.landingPageUrl, bucket);
  }

  const rows: LandingPageRow[] = Array.from(groups.entries())
    .map(([url, pageCalls]) => {
      const answered = pageCalls.filter(isAnswered).length;
      const withTitle = pageCalls.find((c) => c.pageTitle);
      return {
        url,
        label: withTitle?.pageTitle || url,
        calls: pageCalls.length,
        answered,
        missed: pageCalls.length - answered,
        answerRate: pageCalls.length > 0 ? Math.round((answered / pageCalls.length) * 100) : null,
      };
    })
    .sort((a, b) => b.calls - a.calls)
    .slice(0, limit);

  return { status: 'available', rows, subtitle };
}

export interface PpcAssistedInfo {
  status: 'available' | 'not-connected';
  count: number;
  subtitle: string;
}

// Counts only calls where Infinity's own ppcAssisted field is explicitly
// true — never inferred from referrer, landing page, domain, or chType.
export function getPpcAssistedCalls(
  data: InfinityCallsResponse | null,
  isGroupView: boolean,
  selectedEntity: EntitySelection
): PpcAssistedInfo {
  const { status, calls, subtitle } = getRelevantCalls(data, isGroupView, selectedEntity);
  if (status === 'not-connected') return { status, count: 0, subtitle };

  const count = calls.filter((c) => c.ppcAssisted === true).length;
  return { status: 'available', count, subtitle: 'Infinity PPC-Assisted Calls — from ppcAssisted only' };
}

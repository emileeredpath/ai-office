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

// Single shared source of truth for "what does real call performance mean
// for the current entity selection" — used by the Call Tracking page (and
// any future consumer) so they can never disagree. Only entities with a
// confirmed real dgrpName mapping (see infinity.ts) ever show real
// figures; everything else — including MTech Group until at least one
// entity is mapped — shows an honest "Not connected"/"not yet confirmed"
// state rather than a guess.
export function getCallPerformance(
  data: InfinityCallsResponse | null,
  isGroupView: boolean,
  selectedEntity: EntitySelection
): CallPerformanceInfo {
  if (!data || !data.configured) {
    return { status: 'not-connected', subtitle: 'Awaiting Infinity integration' };
  }

  if (!isGroupView) {
    const brand = selectedEntity as Brand;
    if (!data.mappedBrands.includes(brand)) {
      return { status: 'not-connected', subtitle: 'Entity-level call attribution not confirmed yet' };
    }
    const relevant = data.calls.filter((c) => c.brand === brand);
    return summarize(relevant, relevant.length > 0 ? 'Real Infinity calls for this entity' : 'No Infinity calls for this entity in this period');
  }

  const mappedGroupBrands = data.mappedBrands.filter((b) => GROUP_AGGREGATE_BRANDS.includes(b));
  if (mappedGroupBrands.length === 0) {
    return { status: 'not-connected', subtitle: 'No entities have confirmed Infinity call attribution yet' };
  }
  const relevant = data.calls.filter((c) => c.brand && GROUP_AGGREGATE_BRANDS.includes(c.brand));
  return summarize(relevant, `Combined real Infinity calls across ${mappedGroupBrands.length} of ${GROUP_AGGREGATE_BRANDS.length} entities with confirmed attribution`);
}

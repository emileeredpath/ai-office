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

// A call is only ever "bridged" once a person actually connects — used as
// the answered/missed signal since Infinity's callState enum values
// aren't confirmed against the real account yet (see infinity.ts).
function isAnswered(call: InfinityCallRecord): boolean {
  return (call.bridgeDuration ?? 0) > 0;
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
  const answeredCalls = calls.filter(isAnswered).length;
  const missedCalls = calls.length - answeredCalls;
  const durations = calls.map((c) => c.callDuration ?? 0);
  const avgSeconds = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
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

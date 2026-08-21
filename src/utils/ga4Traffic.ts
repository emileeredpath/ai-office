import type { Brand } from '@/types/index';
import type { EntitySelection } from '@/contexts/EntityContext';
import type { Period } from '@/contexts/PeriodContext';
import { periodStartDate } from '@/contexts/PeriodContext';
import type { Ga4TrafficResponse } from '@/services/ga4Api';

// GA4's own earliest supported date for the Analytics Data API — mirrors
// GA4_EARLIEST_SUPPORTED_DATE in backend/src/services/ga4.ts. Used as the
// honest "All time" floor: not a guess at when any property started
// collecting data, just the API's own documented lower bound, so it can
// never overstate what's genuinely available.
export const GA4_EARLIEST_SUPPORTED_DATE = '2015-08-14';

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Resolves the global Period selector to the exact calendar-period
// boundaries GA4 should be queried for — never a rolling-day
// approximation (periodStartDate() already gives real calendar
// boundaries: 1st of the month, quarter, or year). "All time" uses the
// GA4 API's own earliest supported date rather than an unbounded range.
export function resolveGa4DateRange(period: Period, now: Date = new Date()): { startDate: string; endDate: string } {
  const start = periodStartDate(period, now);
  return {
    startDate: start ? toIsoDate(start) : GA4_EARLIEST_SUPPORTED_DATE,
    endDate: toIsoDate(now),
  };
}

// The four entities GA4 traffic is combined across at "MTech Group" level
// in Phase 1 — deliberately just the brands the V2 entity selector
// actually exposes. mtech's and idaro's GA4 properties (if ever
// configured) are out of scope for this phase's group aggregate, even
// though the backend supports both — this is a frontend scoping decision,
// not a backend limitation.
const GROUP_AGGREGATE_BRANDS: Brand[] = ['brentwood', 'radio-links', 'capcom', 'ircl'];

export interface WebsiteUsersInfo {
  status: 'available' | 'not-connected';
  activeUsers?: number;
  sessions?: number;
  subtitle: string;
}

// Single shared source of truth for "what does Website Users mean for the
// current entity selection" — used identically by Overview, Performance,
// and Reports so they can never disagree. Website Users always means GA4
// activeUsers, never sessions. An entity with no configured GA4 property
// always shows "Not connected" — never a fabricated 0, and never silently
// dropped from a group total without saying so.
export function getWebsiteUsers(
  ga4: Ga4TrafficResponse | null,
  isGroupView: boolean,
  selectedEntity: EntitySelection
): WebsiteUsersInfo {
  if (!ga4 || !ga4.configured) {
    return { status: 'not-connected', subtitle: 'Awaiting GA4 integration' };
  }

  if (!isGroupView) {
    const entry = ga4.brands.find((b) => b.brand === selectedEntity);
    if (entry) {
      return { status: 'available', activeUsers: entry.activeUsers, sessions: entry.sessions, subtitle: 'GA4 active users' };
    }
    const hasProperty = ga4.configuredBrands.includes(selectedEntity as Brand);
    return {
      status: 'not-connected',
      subtitle: hasProperty ? 'GA4 fetch failed for this entity' : 'Awaiting GA4 integration for this entity',
    };
  }

  const relevant = ga4.brands.filter((b) => GROUP_AGGREGATE_BRANDS.includes(b.brand));
  if (relevant.length === 0) {
    return { status: 'not-connected', subtitle: 'Awaiting GA4 integration' };
  }

  const activeUsers = relevant.reduce((sum, b) => sum + b.activeUsers, 0);
  const sessions = relevant.reduce((sum, b) => sum + b.sessions, 0);
  const configuredCount = relevant.length;
  const totalCount = GROUP_AGGREGATE_BRANDS.length;
  const subtitle =
    configuredCount < totalCount
      ? `Combined GA4 active users across ${configuredCount} of ${totalCount} websites`
      : `Combined GA4 active users across ${totalCount} websites`;

  return { status: 'available', activeUsers, sessions, subtitle };
}

// Per-entity lookup for tables (e.g. Performance by Brand) that need one
// row per brand rather than a single group-scoped figure.
export function getWebsiteUsersForBrand(ga4: Ga4TrafficResponse | null, brand: Brand): WebsiteUsersInfo {
  if (!ga4 || !ga4.configured) {
    return { status: 'not-connected', subtitle: 'Awaiting GA4 integration' };
  }
  const entry = ga4.brands.find((b) => b.brand === brand);
  if (entry) {
    return { status: 'available', activeUsers: entry.activeUsers, sessions: entry.sessions, subtitle: 'GA4 active users' };
  }
  const hasProperty = ga4.configuredBrands.includes(brand);
  return {
    status: 'not-connected',
    subtitle: hasProperty ? 'GA4 fetch failed for this entity' : 'Awaiting GA4 integration for this entity',
  };
}

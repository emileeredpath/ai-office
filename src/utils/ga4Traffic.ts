import type { Brand } from '@/types/index';
import type { EntitySelection } from '@/contexts/EntityContext';
import type { Period } from '@/contexts/PeriodContext';
import { periodStartDate } from '@/contexts/PeriodContext';
import type { Ga4TrafficResponse, Ga4SocialTrafficResponse, Ga4SocialNetworkRow, Ga4SocialLandingPageRow } from '@/services/ga4Api';
import { GROUP_AGGREGATE_BRANDS } from '@/utils/groupEntities';

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

// ---------------------------------------------------------------------
// GA4 Social Traffic (Phase 1) — website sessions/users GA4 attributes
// to Organic/Paid Social via its own sessionDefaultChannelGroup, broken
// down by raw sessionSource ("by network" — GA4 provides referring
// domains, not a canonical platform name, so raw values are shown as-is,
// never relabelled or guessed into "LinkedIn"/"Facebook"/"Instagram")
// and top landing pages. A completely separate data source from Website
// Users/Sessions above — this section can never change those figures as
// a side effect, and vice versa. Only ever reports what a session/user
// did once it reached the website; impressions, reach, engagement,
// followers, and posts published are platform-side metrics GA4 has no
// visibility into at all and are never invented here — those remain
// "Not connected" pending a real Hootsuite/platform integration.

export interface SocialTrafficInfo {
  status: 'available' | 'not-connected';
  sessions?: number;
  users?: number;
  organicSessions?: number;
  organicUsers?: number;
  paidSessions?: number;
  paidUsers?: number;
  subtitle: string;
}

function emptySocialTotals() {
  return { sessions: 0, users: 0, organicSessions: 0, organicUsers: 0, paidSessions: 0, paidUsers: 0 };
}

// GA4's own two social channel-group values — exported so ga4Enquiries.ts
// can filter enquiry rows down to "from Social" without redefining these
// literals a second time.
export const SOCIAL_CHANNEL_GROUPS = ['Organic Social', 'Paid Social'] as const;

export function getSocialTraffic(
  ga4Social: Ga4SocialTrafficResponse | null,
  isGroupView: boolean,
  selectedEntity: EntitySelection
): SocialTrafficInfo {
  if (!ga4Social || !ga4Social.configured) {
    return { status: 'not-connected', subtitle: 'Awaiting GA4 integration' };
  }

  if (!isGroupView) {
    const entry = ga4Social.brands.find((b) => b.brand === selectedEntity);
    if (entry) {
      return {
        status: 'available',
        sessions: entry.sessions,
        users: entry.users,
        organicSessions: entry.organicSessions,
        organicUsers: entry.organicUsers,
        paidSessions: entry.paidSessions,
        paidUsers: entry.paidUsers,
        subtitle: 'GA4 social traffic (Organic Social + Paid Social)',
      };
    }
    const hasProperty = ga4Social.configuredBrands.includes(selectedEntity as Brand);
    return {
      status: 'not-connected',
      subtitle: hasProperty ? 'GA4 fetch failed for this entity' : 'Awaiting GA4 integration for this entity',
    };
  }

  const relevant = ga4Social.brands.filter((b) => GROUP_AGGREGATE_BRANDS.includes(b.brand));
  if (relevant.length === 0) {
    return { status: 'not-connected', subtitle: 'Awaiting GA4 integration' };
  }

  const totals = relevant.reduce((acc, b) => {
    acc.sessions += b.sessions;
    acc.users += b.users;
    acc.organicSessions += b.organicSessions;
    acc.organicUsers += b.organicUsers;
    acc.paidSessions += b.paidSessions;
    acc.paidUsers += b.paidUsers;
    return acc;
  }, emptySocialTotals());

  const configuredCount = relevant.length;
  const totalCount = GROUP_AGGREGATE_BRANDS.length;
  const subtitle =
    configuredCount < totalCount
      ? `Combined GA4 social traffic across ${configuredCount} of ${totalCount} websites`
      : `Combined GA4 social traffic across ${totalCount} websites`;

  return { status: 'available', ...totals, subtitle };
}

export interface SocialNetworkBreakdown {
  status: 'available' | 'not-connected';
  rows: Ga4SocialNetworkRow[];
  subtitle: string;
}

// Group-level "by network" combines the same brands' raw sessionSource
// rows, summing sessions/users for any source string that appears in
// more than one property's results — never renamed, never bucketed.
export function getSocialNetworkBreakdown(
  ga4Social: Ga4SocialTrafficResponse | null,
  isGroupView: boolean,
  selectedEntity: EntitySelection
): SocialNetworkBreakdown {
  if (!ga4Social || !ga4Social.configured) {
    return { status: 'not-connected', rows: [], subtitle: 'Awaiting GA4 integration' };
  }

  if (!isGroupView) {
    const entry = ga4Social.brands.find((b) => b.brand === selectedEntity);
    if (entry) {
      return { status: 'available', rows: entry.byNetwork, subtitle: 'GA4 sessionSource — raw referring domain, not a platform label' };
    }
    const hasProperty = ga4Social.configuredBrands.includes(selectedEntity as Brand);
    return {
      status: 'not-connected',
      rows: [],
      subtitle: hasProperty ? 'GA4 fetch failed for this entity' : 'Awaiting GA4 integration for this entity',
    };
  }

  const relevant = ga4Social.brands.filter((b) => GROUP_AGGREGATE_BRANDS.includes(b.brand));
  if (relevant.length === 0) {
    return { status: 'not-connected', rows: [], subtitle: 'Awaiting GA4 integration' };
  }

  const totals = new Map<string, { sessions: number; users: number }>();
  for (const brand of relevant) {
    for (const row of brand.byNetwork) {
      const existing = totals.get(row.source) ?? { sessions: 0, users: 0 };
      existing.sessions += row.sessions;
      existing.users += row.users;
      totals.set(row.source, existing);
    }
  }
  const rows: Ga4SocialNetworkRow[] = Array.from(totals.entries())
    .map(([source, v]) => ({ source, sessions: v.sessions, users: v.users }))
    .sort((a, b) => b.sessions - a.sessions);

  return { status: 'available', rows, subtitle: 'GA4 sessionSource — raw referring domain, not a platform label' };
}

export interface SocialTopLandingPages {
  status: 'available' | 'not-connected';
  rows: Ga4SocialLandingPageRow[];
  subtitle: string;
}

// Group-level totals combine each brand's own top-10 landing pages (the
// backend already truncates per property before returning, to keep the
// response small) — a page that ranks just outside one property's own
// top 10 isn't included in the group total. This is an honest trade-off
// for payload size, not a data gap worth a full untruncated fetch for a
// "top landing pages" view; documented here rather than silently assumed.
export function getSocialTopLandingPages(
  ga4Social: Ga4SocialTrafficResponse | null,
  isGroupView: boolean,
  selectedEntity: EntitySelection,
  limit = 10
): SocialTopLandingPages {
  if (!ga4Social || !ga4Social.configured) {
    return { status: 'not-connected', rows: [], subtitle: 'Awaiting GA4 integration' };
  }

  if (!isGroupView) {
    const entry = ga4Social.brands.find((b) => b.brand === selectedEntity);
    if (entry) {
      return { status: 'available', rows: entry.topLandingPages.slice(0, limit), subtitle: 'GA4 landing pages reached via social traffic' };
    }
    const hasProperty = ga4Social.configuredBrands.includes(selectedEntity as Brand);
    return {
      status: 'not-connected',
      rows: [],
      subtitle: hasProperty ? 'GA4 fetch failed for this entity' : 'Awaiting GA4 integration for this entity',
    };
  }

  const relevant = ga4Social.brands.filter((b) => GROUP_AGGREGATE_BRANDS.includes(b.brand));
  if (relevant.length === 0) {
    return { status: 'not-connected', rows: [], subtitle: 'Awaiting GA4 integration' };
  }

  const totals = new Map<string, number>();
  for (const brand of relevant) {
    for (const row of brand.topLandingPages) {
      totals.set(row.landingPage, (totals.get(row.landingPage) ?? 0) + row.sessions);
    }
  }
  const rows: Ga4SocialLandingPageRow[] = Array.from(totals.entries())
    .map(([landingPage, sessions]) => ({ landingPage, sessions }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, limit);

  return { status: 'available', rows, subtitle: 'GA4 landing pages reached via social traffic' };
}

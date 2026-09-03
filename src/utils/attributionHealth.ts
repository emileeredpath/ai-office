import type { Task, Campaign, Brand } from '@/types/index';
import type { EntitySelection } from '@/contexts/EntityContext';
import type { EmailPerformanceResponse } from '@/services/emailPerformanceApi';
import type { InfinityCallsResponse } from '@/services/infinityCallsApi';
import { getCallSourceBreakdown } from '@/utils/callPerformance';

// Attribution Health / Unmatched Activity — see DATA_INTEGRITY.md and the
// Reporting Foundations audit. Every set here reports the EXISTING linkage
// each integration already computes; nothing here re-guesses or
// strengthens a match. Where an integration has no linkage mechanism at
// all today, that's reported honestly as "not currently attributable,"
// never silently omitted or presented as if a match had been checked.

export type AttributionGapStatus = 'available' | 'not-connected' | 'not-applicable';

export interface AttributionGap {
  status: AttributionGapStatus;
  count: number | null;
  subtitle: string;
}

// Campaign Monitor sends whose dashboardCampaignId is null — i.e. the
// existing (heuristic, name/word-fragment) linker in
// backend/src/services/campaignMonitor.ts's buildCampaignMap could not
// confidently match this send to an AI Office campaign. That linker is
// NOT strengthened here — this only surfaces its real, already-computed
// result honestly instead of letting an unmatched send silently vanish
// from every campaign-scoped view.
export function getUnmappedEmailSends(
  data: EmailPerformanceResponse | null,
  matchesSelectedEntity: (brand: Brand | null | undefined) => boolean
): AttributionGap {
  if (!data || !data.configured) {
    return { status: 'not-connected', count: null, subtitle: 'Awaiting Campaign Monitor integration' };
  }
  const relevant = data.campaigns.filter((c) => matchesSelectedEntity(c.brand));
  const unmapped = relevant.filter((c) => !c.dashboardCampaignId);
  return {
    status: 'available',
    count: unmapped.length,
    subtitle: unmapped.length > 0 ? `${unmapped.length} real Campaign Monitor send(s) not linked to any AI Office campaign` : 'Every real Campaign Monitor send in this period is linked to a campaign',
  };
}

// Infinity calls whose chType doesn't map to a confirmed real source
// value (ppc/seo/direct/ref) — reuses the exact same "Unclassified"
// bucket already computed for the Call Tracking screen's source
// breakdown, never a separate/looser definition of "unattributed."
export function getUnclassifiedCalls(
  data: InfinityCallsResponse | null,
  isGroupView: boolean,
  selectedEntity: EntitySelection
): AttributionGap {
  const breakdown = getCallSourceBreakdown(data, isGroupView, selectedEntity);
  if (breakdown.status === 'not-connected') {
    return { status: 'not-connected', count: null, subtitle: breakdown.subtitle };
  }
  const unclassified = breakdown.buckets.find((b) => b.source === 'Unclassified');
  const count = unclassified?.calls ?? 0;
  return {
    status: 'available',
    count,
    subtitle: count > 0 ? `${count} real call(s) with no recognised source (chType)` : 'Every real call in this period has a recognised source',
  };
}

// AI Office campaigns with zero matched activity: no linked task/email-send
// (task.campaignId), and every manually-logged figure (leads, spend,
// enquiries received) is genuinely zero. Fully computable from data
// already in the store — no new backend work, per the audit.
export interface UnmatchedCampaign {
  id: string;
  name: string;
  brand: Brand;
}

export function getCampaignsWithNoActivity(campaigns: Campaign[], tasks: Task[]): UnmatchedCampaign[] {
  const campaignIdsWithTasks = new Set(tasks.filter((t) => t.campaignId).map((t) => t.campaignId));
  return campaigns
    .filter((c) => !campaignIdsWithTasks.has(c.id))
    .filter((c) => !c.leads && !c.spend && !c.results?.enquiriesReceived)
    .map((c) => ({ id: c.id, name: c.name, brand: c.brand }));
}

// Sources with genuinely no campaign-linkage mechanism today — reported
// honestly as "not applicable" rather than omitted or faked as zero.
// See REPORTING_PERIOD.md / the attribution audit for why each is what it
// is:
//  - Google Ads: no linkage field exists in the integration at all
//    (PpcScreen.tsx: "shown exactly as returned — never matched to a
//    dashboard campaign record").
//  - GA4 enquiries: no general per-enquiry campaign dimension exists;
//    the only two campaign-scoped GA4 queries in the app are hardcoded
//    to two specific named campaigns, not a reusable per-enquiry link.
//  - Marketing spend without a campaign: structurally impossible in the
//    current data model — `spend` only ever exists as a field directly on
//    a Campaign row, so it cannot exist unattached to one.
export const GOOGLE_ADS_ATTRIBUTION_GAP: AttributionGap = {
  status: 'not-applicable',
  count: null,
  subtitle: 'No campaign-linkage mechanism exists yet for Google Ads campaigns',
};

export const GA4_ENQUIRY_ATTRIBUTION_GAP: AttributionGap = {
  status: 'not-applicable',
  count: null,
  subtitle: 'GA4 enquiries have no general per-record campaign link today',
};

export const SPEND_WITHOUT_CAMPAIGN_GAP: AttributionGap = {
  status: 'not-applicable',
  count: 0,
  subtitle: 'Structurally impossible — spend is always logged directly against a campaign',
};

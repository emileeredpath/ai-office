import type { Brand } from '@/types/index';
import type { EntitySelection } from '@/contexts/EntityContext';
import type { Period } from '@/contexts/PeriodContext';
import { periodStartDate } from '@/contexts/PeriodContext';
import type { GoogleAdsResponse, GoogleAdsBrandPerformance, GoogleAdsCampaignRow } from '@/services/googleAdsApi';
import type { Ga4EnquiriesResponse } from '@/services/ga4Api';
import { GROUP_AGGREGATE_BRANDS } from '@/utils/groupEntities';

// Google Ads (Phase 1) — real campaign performance for Brentwood and Radio
// Links only, confirmed live against both real accounts (see
// backend/src/services/googleAds.ts's header comment). Capcom and Irish
// Radio have no Google Ads account and stay honestly "Not connected"
// here — never a fabricated 0, never silently dropped from a group total
// without saying so. Google Ads' own conversions metric is a genuinely
// different signal from GA4 Enquiries (src/utils/ga4Enquiries.ts) — the
// two are combined only in getCostPerGa4Enquiry below, and even there
// they stay two distinct, separately-labelled numbers, never merged into
// one "conversions" figure.

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Google Ads accounts can typically report much further back than GA4's
// documented floor, but this app has no equivalent honest floor to cite
// for it (unlike GA4_EARLIEST_SUPPORTED_DATE) — "All time" here means
// "everything Google Ads returns for this account," not a claim of
// complete history, same honesty caveat as Campaign Monitor's sentinel.
const ALL_TIME_SENTINEL = '2000-01-01';

export function resolveGoogleAdsDateRange(period: Period, now: Date = new Date()): { startDate: string; endDate: string } {
  const start = periodStartDate(period, now);
  return {
    startDate: start ? toIsoDate(start) : ALL_TIME_SENTINEL,
    endDate: toIsoDate(now),
  };
}

interface RelevantGoogleAdsBrands {
  status: 'available' | 'not-connected';
  brands: GoogleAdsBrandPerformance[];
  subtitle: string;
}

// Shared entity/period-scoped brand selection every function below reads
// from, so the headline summary, campaign table, and cost-per-GA4-enquiry
// figure can never disagree about which accounts are "in scope."
function getRelevantGoogleAdsBrands(
  data: GoogleAdsResponse | null,
  isGroupView: boolean,
  selectedEntity: EntitySelection
): RelevantGoogleAdsBrands {
  if (!data || !data.configured) {
    return { status: 'not-connected', brands: [], subtitle: 'Awaiting Google Ads integration' };
  }

  if (!isGroupView) {
    const entry = data.brands.find((b) => b.brand === selectedEntity);
    if (entry) {
      return { status: 'available', brands: [entry], subtitle: 'Real Google Ads data for this entity' };
    }
    const hasAccount = data.configuredBrands.includes(selectedEntity as Brand);
    return {
      status: 'not-connected',
      brands: [],
      subtitle: hasAccount ? 'Google Ads fetch failed for this entity' : 'No Google Ads account connected for this entity',
    };
  }

  const relevant = data.brands.filter((b) => GROUP_AGGREGATE_BRANDS.includes(b.brand));
  if (relevant.length === 0) {
    return { status: 'not-connected', brands: [], subtitle: 'No entities have a connected Google Ads account yet' };
  }
  const configuredCount = relevant.length;
  const totalCount = GROUP_AGGREGATE_BRANDS.length;
  const subtitle =
    configuredCount < totalCount
      ? `Combined Google Ads spend across ${configuredCount} of ${totalCount} entities`
      : `Combined Google Ads spend across ${totalCount} entities`;
  return { status: 'available', brands: relevant, subtitle };
}

export interface GoogleAdsSummary {
  status: 'available' | 'not-connected';
  spend?: number;
  impressions?: number;
  clicks?: number;
  ctr?: number | null;
  averageCpc?: number | null;
  conversions?: number;
  costPerConversion?: number | null;
  subtitle: string;
}

// Single shared source of truth for "what does Google Ads performance
// mean for the current entity selection" — used identically by PPC,
// Performance, and Reports so they can never disagree.
export function getGoogleAdsSummary(
  data: GoogleAdsResponse | null,
  isGroupView: boolean,
  selectedEntity: EntitySelection
): GoogleAdsSummary {
  const relevant = getRelevantGoogleAdsBrands(data, isGroupView, selectedEntity);
  if (relevant.status === 'not-connected') {
    return { status: 'not-connected', subtitle: relevant.subtitle };
  }

  const spend = relevant.brands.reduce((sum, b) => sum + b.spend, 0);
  const impressions = relevant.brands.reduce((sum, b) => sum + b.impressions, 0);
  const clicks = relevant.brands.reduce((sum, b) => sum + b.clicks, 0);
  // Conversions kept as a real fractional sum — Google Ads' own
  // partial-credit attribution is never rounded to a whole number.
  const conversions = relevant.brands.reduce((sum, b) => sum + b.conversions, 0);

  return {
    status: 'available',
    spend,
    impressions,
    clicks,
    ctr: impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : null,
    averageCpc: clicks > 0 ? Math.round((spend / clicks) * 100) / 100 : null,
    conversions,
    costPerConversion: conversions > 0 ? Math.round((spend / conversions) * 100) / 100 : null,
    subtitle: relevant.subtitle,
  };
}

export interface GoogleAdsCampaignsInfo {
  status: 'available' | 'not-connected';
  rows: (GoogleAdsCampaignRow & { brand: Brand })[];
  // Campaigns with genuinely zero impressions/clicks/spend this period —
  // excluded from `rows` by default (real but not useful in the main
  // view), but counted here rather than silently discarded, so the UI
  // can say "N campaigns with no activity this period are hidden"
  // instead of pretending they don't exist.
  hiddenZeroActivityCount: number;
  subtitle: string;
}

// Real campaign rows only — never fuzzy-matched to a dashboard Campaign
// record. Sorted by spend descending; zero-activity campaigns (commonly
// PAUSED/REMOVED campaigns with no real metrics in this date range) are
// excluded from the main list by default.
export function getGoogleAdsCampaigns(
  data: GoogleAdsResponse | null,
  isGroupView: boolean,
  selectedEntity: EntitySelection
): GoogleAdsCampaignsInfo {
  const relevant = getRelevantGoogleAdsBrands(data, isGroupView, selectedEntity);
  if (relevant.status === 'not-connected') {
    return { status: 'not-connected', rows: [], hiddenZeroActivityCount: 0, subtitle: relevant.subtitle };
  }

  const allRows = relevant.brands.flatMap((b) => b.campaigns.map((c) => ({ ...c, brand: b.brand })));
  const active = allRows.filter((c) => c.impressions > 0 || c.clicks > 0 || c.spend > 0);
  const hiddenZeroActivityCount = allRows.length - active.length;

  return {
    status: 'available',
    rows: active.sort((a, b) => b.spend - a.spend),
    hiddenZeroActivityCount,
    subtitle: relevant.subtitle,
  };
}

export interface CostPerGa4EnquiryInfo {
  status: 'available' | 'not-connected';
  spend?: number;
  clicks?: number;
  ga4Enquiries?: number;
  costPerEnquiry?: number | null;
  subtitle: string;
}

// Combines two independently-computed, independently-verified real
// figures — Google Ads spend/clicks and GA4 Enquiries — for the exact
// same entity/period selection. Never assumes Google Ads' own
// conversions metric equals GA4 Enquiries; that figure is not read here
// at all. Both remain separately visible wherever this is shown.
//
// Takes the raw GA4 Enquiries response (not an already-group-aggregated
// EnquiriesInfo) deliberately: at MTech Group level, GA4 Enquiries is
// confirmed for all four entities, but Google Ads is only connected for
// two (Brentwood, Radio Links). Reusing a pre-aggregated "all 4 entities"
// enquiries total here would silently divide Google-Ads-only spend by
// enquiries from entities with no Google Ads spend behind them at all —
// this restricts the GA4 Enquiries side to exactly the same brands
// Google Ads covers for the current selection, every time.
export function getCostPerGa4Enquiry(
  googleAdsData: GoogleAdsResponse | null,
  enquiriesData: Ga4EnquiriesResponse | null,
  isGroupView: boolean,
  selectedEntity: EntitySelection
): CostPerGa4EnquiryInfo {
  const relevantGoogleAds = getRelevantGoogleAdsBrands(googleAdsData, isGroupView, selectedEntity);
  if (relevantGoogleAds.status === 'not-connected') {
    return { status: 'not-connected', subtitle: relevantGoogleAds.subtitle };
  }
  if (!enquiriesData || !enquiriesData.configured) {
    return { status: 'not-connected', subtitle: 'Awaiting GA4 integration' };
  }

  const googleAdsBrands = relevantGoogleAds.brands.map((b) => b.brand);
  const matchingEnquiryBrands = enquiriesData.brands.filter((b) => googleAdsBrands.includes(b.brand));
  if (matchingEnquiryBrands.length === 0) {
    return { status: 'not-connected', subtitle: 'No verified GA4 Enquiry definition for the connected Google Ads entities' };
  }

  const spend = relevantGoogleAds.brands.reduce((sum, b) => sum + b.spend, 0);
  const clicks = relevantGoogleAds.brands.reduce((sum, b) => sum + b.clicks, 0);
  const ga4Enquiries = matchingEnquiryBrands.reduce((sum, b) => sum + b.total, 0);

  const subtitle =
    matchingEnquiryBrands.length < googleAdsBrands.length
      ? `Real Google Ads spend ÷ real GA4 Enquiries — only ${matchingEnquiryBrands.length} of ${googleAdsBrands.length} connected Google Ads entities have a verified GA4 Enquiry definition`
      : 'Real Google Ads spend ÷ real GA4 Enquiries for the same entity and period';

  return {
    status: 'available',
    spend,
    clicks,
    ga4Enquiries,
    costPerEnquiry: ga4Enquiries > 0 ? Math.round((spend / ga4Enquiries) * 100) / 100 : null,
    subtitle,
  };
}

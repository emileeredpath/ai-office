// Central campaign-attribution layer (Campaign Attribution phase).
//
// This is the one place that decides whether a piece of real marketing
// activity belongs to a real AI Office Campaign. Every screen that needs a
// campaign-linked figure (Campaign Detail, Attribution Health) should read
// through here rather than re-deriving its own matching logic — the same
// discipline already established for Campaign Monitor's task.campaignId
// (see backend/src/services/campaignMonitor.ts) is applied here to Google
// Ads and Infinity.
//
// Only two positive attribution states exist anywhere in this app:
//   - Explicit  — a user deliberately set the link (Campaign Monitor's
//                 campaignMappingSource: 'manual'; a campaign's own
//                 googleAdsCampaignIds, which a user typed in; a Tracking
//                 Link's landing page, which a user explicitly configured).
//   - Deterministic — a reliable identifier match (an exact Campaign
//                 Monitor name match set by the sync; an exact Google Ads
//                 campaign.id match; an exact landing-page-path match).
// Anything that cannot be established either way is Unmatched. There is no
// third "probably this one" state — see DATA_INTEGRITY.md.
//
// What this file does NOT cover yet (see the Campaign Attribution phase
// report for why): GA4 session/enquiry attribution needs new backend query
// support (an exact sessionCampaignName match against a campaign's own
// Tracking Link utmCampaign values) that hasn't shipped yet. Until that
// lands, GA4 campaign-level figures stay "Not connected" on Campaign
// Detail rather than guessing from date/volume alone.
import type { Campaign, Brand } from '@/types/index';
import type { GoogleAdsResponse, GoogleAdsCampaignRow, GoogleAdsBrandPerformance } from '@/services/googleAdsApi';
import type { InfinityCallsResponse } from '@/services/infinityCallsApi';
import { isAnswered } from '@/utils/callPerformance';

export interface CampaignGoogleAdsAttribution {
  status: 'available' | 'unmapped' | 'not-connected';
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number | null;
  averageCpc: number | null;
  conversions: number;
  costPerConversion: number | null;
  // The real per-campaign rows this total was built from, so Campaign
  // Detail can show exactly which Google Ads campaign(s) contributed —
  // never a single opaque number with no way to verify it.
  matchedCampaigns: GoogleAdsCampaignRow[];
}

// Deterministic only: sums every real Google Ads campaign row (across every
// brand queried) whose campaign.id exactly matches one of this AI Office
// campaign's own googleAdsCampaignIds. A campaign with no IDs configured is
// 'unmapped', never silently zero — Campaign Detail must be able to tell
// "nothing spent" apart from "nothing mapped."
export function getGoogleAdsForCampaign(
  data: GoogleAdsResponse | null,
  campaign: Campaign
): CampaignGoogleAdsAttribution {
  const ids = campaign.googleAdsCampaignIds ?? [];
  if (!data || !data.configured) {
    return { status: 'not-connected', spend: 0, impressions: 0, clicks: 0, ctr: null, averageCpc: null, conversions: 0, costPerConversion: null, matchedCampaigns: [] };
  }
  if (ids.length === 0) {
    return { status: 'unmapped', spend: 0, impressions: 0, clicks: 0, ctr: null, averageCpc: null, conversions: 0, costPerConversion: null, matchedCampaigns: [] };
  }

  const idSet = new Set(ids);
  const matchedCampaigns: GoogleAdsCampaignRow[] = [];
  for (const brand of data.brands) {
    for (const row of brand.campaigns) {
      if (idSet.has(row.campaignId)) matchedCampaigns.push(row);
    }
  }

  const spend = matchedCampaigns.reduce((sum, c) => sum + c.spend, 0);
  const impressions = matchedCampaigns.reduce((sum, c) => sum + c.impressions, 0);
  const clicks = matchedCampaigns.reduce((sum, c) => sum + c.clicks, 0);
  const conversions = matchedCampaigns.reduce((sum, c) => sum + c.conversions, 0);

  return {
    status: 'available',
    spend,
    impressions,
    clicks,
    ctr: impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : null,
    averageCpc: clicks > 0 ? Math.round((spend / clicks) * 100) / 100 : null,
    conversions,
    costPerConversion: conversions > 0 ? Math.round((spend / conversions) * 100) / 100 : null,
    matchedCampaigns,
  };
}

export interface UnmatchedGoogleAdsCampaign {
  campaignId: string;
  campaignName: string;
  brand: GoogleAdsBrandPerformance['brand'];
  spend: number;
}

// Every real Google Ads campaign, across every configured brand, whose ID
// isn't claimed by any AI Office campaign's googleAdsCampaignIds — the
// genuine gap list for Attribution Health. Never guesses a likely owner by
// name similarity.
export function getUnmatchedGoogleAdsCampaigns(
  data: GoogleAdsResponse | null,
  campaigns: Campaign[]
): UnmatchedGoogleAdsCampaign[] {
  if (!data || !data.configured) return [];
  const mappedIds = new Set(campaigns.flatMap((c) => c.googleAdsCampaignIds ?? []));
  const unmatched: UnmatchedGoogleAdsCampaign[] = [];
  for (const brand of data.brands) {
    for (const row of brand.campaigns) {
      if (!mappedIds.has(row.campaignId)) {
        unmatched.push({ campaignId: row.campaignId, campaignName: row.campaignName, brand: brand.brand, spend: row.spend });
      }
    }
  }
  return unmatched;
}

// Infinity has no campaign identifier of its own (confirmed blank in real
// records — see backend/src/services/infinity.ts's header comment). The
// one genuinely deterministic link available is a call's landingPageUrl
// exactly matching a landing page a user explicitly configured on one of
// this campaign's own Tracking Links (CampaignPerformanceTab) — that
// Tracking Link IS the explicit, agreed mapping; this is not "inferring
// from landing page alone." Matching is on the URL path only (host/
// protocol/query/trailing-slash differences are normalised away, since
// Infinity and a manually-typed Tracking Link URL are never guaranteed to
// be recorded byte-for-byte identically) — never a substring/fuzzy match.
// Only aggregate counts are ever returned here — never a caller phone
// number or any other per-call personal data; Campaign Detail does not
// need it to report campaign performance.
function normalisedPath(url: string): string | null {
  try {
    const u = new URL(url, 'https://placeholder.invalid');
    return u.pathname.replace(/\/+$/, '').toLowerCase() || '/';
  } catch {
    return null;
  }
}

export interface CampaignInfinityAttribution {
  status: 'available' | 'unmapped' | 'not-connected';
  calls: number;
  answered: number;
  missed: number;
  answerRate: number | null;
}

export function getInfinityForCampaign(
  data: InfinityCallsResponse | null,
  campaign: Campaign
): CampaignInfinityAttribution {
  const landingPagePaths = new Set(
    (campaign.trackingLinks ?? [])
      .map((l) => normalisedPath(l.landingPage))
      .filter((p): p is string => p !== null)
  );

  if (!data || !data.configured) {
    return { status: 'not-connected', calls: 0, answered: 0, missed: 0, answerRate: null };
  }
  if (landingPagePaths.size === 0) {
    return { status: 'unmapped', calls: 0, answered: 0, missed: 0, answerRate: null };
  }

  const matched = data.calls.filter((call) => {
    if (!call.landingPageUrl) return false;
    const path = normalisedPath(call.landingPageUrl);
    return path !== null && landingPagePaths.has(path);
  });

  const answered = matched.filter(isAnswered).length;
  return {
    status: 'available',
    calls: matched.length,
    answered,
    missed: matched.length - answered,
    answerRate: matched.length > 0 ? Math.round((answered / matched.length) * 1000) / 10 : null,
  };
}

export interface UnmatchedGa4Campaign {
  campaignName: string;
  brand: Brand;
}

// Every real GA4 campaign name with genuine session activity this period
// (per brand — see fetchGa4CampaignNamesInUse) that isn't claimed by any
// AI Office campaign's own ga4CampaignNames. Exact, case-insensitive
// comparison only — the same discipline as getUnmatchedGoogleAdsCampaigns.
// namesInUseByBrand only needs to include brands GA4 is actually
// configured for; a brand absent or with an empty list contributes
// nothing here, never treated as "no gap."
export function getUnmatchedGa4Campaigns(
  namesInUseByBrand: Partial<Record<Brand, string[]>>,
  campaigns: Campaign[]
): UnmatchedGa4Campaign[] {
  const mappedNames = new Set(campaigns.flatMap((c) => (c.ga4CampaignNames ?? []).map((n) => n.toLowerCase())));
  const unmatched: UnmatchedGa4Campaign[] = [];
  for (const brand of Object.keys(namesInUseByBrand) as Brand[]) {
    for (const name of namesInUseByBrand[brand] ?? []) {
      if (!mappedNames.has(name.toLowerCase())) {
        unmatched.push({ campaignName: name, brand });
      }
    }
  }
  return unmatched;
}

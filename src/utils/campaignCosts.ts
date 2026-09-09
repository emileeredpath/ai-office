// Canonical Campaign Costs calculations (Structured Campaign Costs phase,
// extended by the Legacy Campaign Cost Reconciliation phase). This is the
// ONE place Fixed Costs / Media Spend / Known Campaign Spend are computed —
// every screen that shows one of these figures (Campaign Overview, Campaign
// Performance, the Campaigns list) must call through here rather than
// re-deriving its own sum, so the three numbers can never drift or disagree
// between screens.
import type { Campaign, CampaignCost } from '@/types/index';
import type { CampaignGoogleAdsAttribution } from '@/utils/campaignAttribution';
import { getGoogleAdsForCampaign } from '@/utils/campaignAttribution';
import type { GoogleAdsResponse } from '@/services/googleAdsApi';

export const LEGACY_COST_LABEL = 'Legacy cost — needs classification';

export type FixedCostsSource = 'structured' | 'legacy' | 'none';

export interface FixedCostsResult {
  amount: number;
  source: FixedCostsSource;
  // True only when `amount` is the campaign's un-migrated campaign.spend
  // value shown in lieu of a real classification — never true once at
  // least one structured campaign_costs row exists for this campaign.
  isLegacyFallback: boolean;
}

// Fixed Costs — three-branch rule, evaluated in this exact order, per
// campaign (see the Legacy Campaign Cost Reconciliation phase report):
//   1. Structured campaign_costs rows exist for this campaign -> their sum,
//      full stop. The legacy campaign.spend figure is never read once a
//      single real cost record exists, so adding one immediately retires
//      the fallback, and deleting the last one immediately resumes it.
//   2. No structured rows, but campaign.spend > 0 -> that legacy figure,
//      labelled isLegacyFallback so every caller can show
//      LEGACY_COST_LABEL instead of presenting it as a real classified
//      cost.
//   3. Neither -> £0 (a genuinely empty campaign, e.g. Haven Tender).
// The two sources are never summed together — this is an if/else chain,
// not an addition — so a campaign can never double-count its legacy spend
// on top of its own structured costs.
export function getFixedCosts(costs: CampaignCost[], campaignId: string, legacySpend: number): FixedCostsResult {
  const structured = costs.filter((c) => c.campaignId === campaignId);
  if (structured.length > 0) {
    return { amount: structured.reduce((sum, c) => sum + c.amount, 0), source: 'structured', isLegacyFallback: false };
  }
  if (legacySpend > 0) {
    return { amount: legacySpend, source: 'legacy', isLegacyFallback: true };
  }
  return { amount: 0, source: 'none', isLegacyFallback: false };
}

export interface KnownCampaignSpend {
  fixedCosts: number;
  fixedCostsSource: FixedCostsSource;
  isLegacyFallback: boolean;
  mediaSpend: number;
  mediaSpendStatus: 'available' | 'unmapped' | 'not-connected';
  knownCampaignSpend: number;
}

// Media Spend = live Google Ads spend from this campaign's existing exact
// campaign-id mapping (getGoogleAdsForCampaign in campaignAttribution.ts) —
// never manually entered, never duplicated as a campaign_costs row. Only
// contributes a real, mapped figure to Known Campaign Spend; an unmapped or
// not-connected campaign contributes £0 to the total rather than blocking
// it, but callers should still surface mediaSpendStatus so the UI can show
// "Unmapped"/"Not connected" instead of implying a genuine £0 of ad spend.
export function getKnownCampaignSpend(
  costs: CampaignCost[],
  campaignId: string,
  legacySpend: number,
  googleAds: CampaignGoogleAdsAttribution | null
): KnownCampaignSpend {
  const fixed = getFixedCosts(costs, campaignId, legacySpend);
  const mediaSpendStatus = googleAds?.status ?? 'not-connected';
  const mediaSpend = mediaSpendStatus === 'available' ? (googleAds?.spend ?? 0) : 0;
  return {
    fixedCosts: fixed.amount,
    fixedCostsSource: fixed.source,
    isLegacyFallback: fixed.isLegacyFallback,
    mediaSpend,
    mediaSpendStatus,
    knownCampaignSpend: fixed.amount + mediaSpend,
  };
}

// Single caveat string for any screen presenting a Known Campaign Spend
// total — see MARKETING_SPEND_CAVEAT in campaignMetrics.ts for the older,
// legacy-campaign.spend-only wording this deliberately replaces wherever a
// screen has been migrated to the canonical figure (Performance).
export const KNOWN_CAMPAIGN_SPEND_CAVEAT = 'Fixed costs + connected media spend';

// Convenience wrapper combining getKnownCampaignSpend with the campaign's
// own Google Ads attribution — the exact call already used by the
// Campaigns list (CampaignsTable) and Campaign Detail (CampaignOverviewTab)
// — so every caller summing Known Campaign Spend across many campaigns
// (Performance) reads through this one function rather than re-deriving
// getGoogleAdsForCampaign(...) itself at each call site.
export function getCampaignKnownSpend(
  campaign: Campaign,
  costs: CampaignCost[],
  googleAds: GoogleAdsResponse | null
): KnownCampaignSpend {
  return getKnownCampaignSpend(costs, campaign.id, campaign.spend, getGoogleAdsForCampaign(googleAds, campaign));
}

// Sum of Known Campaign Spend across a set of campaigns — the canonical
// replacement for campaignMetrics.ts's legacy sumSpend() wherever a screen
// needs an aggregate spend figure built from Fixed Costs + connected Media
// Spend rather than raw campaign.spend. Also reports whether any included
// campaign is relying on the legacy campaign.spend fallback (no structured
// campaign_costs row yet), so a caller can surface that classification
// warning at the aggregate level rather than silently absorbing it.
export interface KnownSpendSummary {
  total: number;
  // Fixed Costs and Media Spend sub-totals across the same campaigns —
  // just the two components of `total` (already computed per campaign by
  // getKnownCampaignSpend) summed separately, not a new calculation, so a
  // caller can show "Fixed £X · Media £Y" without re-deriving anything.
  fixedCosts: number;
  mediaSpend: number;
  hasLegacyFallback: boolean;
}

export function sumKnownCampaignSpend(
  campaigns: Campaign[],
  costs: CampaignCost[],
  googleAds: GoogleAdsResponse | null
): KnownSpendSummary {
  let total = 0;
  let fixedCosts = 0;
  let mediaSpend = 0;
  let hasLegacyFallback = false;
  for (const campaign of campaigns) {
    const spend = getCampaignKnownSpend(campaign, costs, googleAds);
    total += spend.knownCampaignSpend;
    fixedCosts += spend.fixedCosts;
    mediaSpend += spend.mediaSpend;
    if (spend.isLegacyFallback) hasLegacyFallback = true;
  }
  return { total, fixedCosts, mediaSpend, hasLegacyFallback };
}

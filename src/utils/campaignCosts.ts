// Canonical Campaign Costs calculations (Structured Campaign Costs phase).
// This is the ONE place Fixed Costs / Media Spend / Known Campaign Spend
// are computed — every screen that shows one of these figures (Campaign
// Overview, Campaign Performance, the Campaigns list) must call through
// here rather than re-deriving its own sum, so the three numbers can never
// drift or disagree between screens.
import type { CampaignCost } from '@/types/index';
import type { CampaignGoogleAdsAttribution } from '@/utils/campaignAttribution';

export interface KnownCampaignSpend {
  fixedCosts: number;
  mediaSpend: number;
  mediaSpendStatus: 'available' | 'unmapped' | 'not-connected';
  knownCampaignSpend: number;
}

// Fixed Costs = sum(campaign_costs.amount) for this campaign — structured,
// manually-entered offline/fixed costs only. Never includes campaign.spend
// (the interim, pre-structured figure — see campaignRestoration.ts's
// restoreEducationCampaignCost doc comment) or any live media spend, so a
// campaign with both a structured Purchased Data cost and a legacy
// campaign.spend value is never double-counted.
export function getFixedCosts(costs: CampaignCost[], campaignId: string): number {
  return costs.filter((c) => c.campaignId === campaignId).reduce((sum, c) => sum + c.amount, 0);
}

// Media Spend = live Google Ads spend from this campaign's existing exact
// campaign-id mapping (getGoogleAdsForCampaign in campaignAttribution.ts) —
// never manually entered, never duplicated as a campaign_costs row. Only
// contributes a real, mapped figure to Known Campaign Spend; an unmapped or
// not-connected campaign contributes £0 to the total rather than blocking
// it, but callers should still surface mediaSpendStatus so the UI can show
// "Unmapped"/"Not connected" instead of implying a genuine £0 of ad spend.
export function getKnownCampaignSpend(costs: CampaignCost[], campaignId: string, googleAds: CampaignGoogleAdsAttribution | null): KnownCampaignSpend {
  const fixedCosts = getFixedCosts(costs, campaignId);
  const mediaSpendStatus = googleAds?.status ?? 'not-connected';
  const mediaSpend = mediaSpendStatus === 'available' ? (googleAds?.spend ?? 0) : 0;
  return {
    fixedCosts,
    mediaSpend,
    mediaSpendStatus,
    knownCampaignSpend: fixedCosts + mediaSpend,
  };
}

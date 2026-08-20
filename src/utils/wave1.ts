import { Campaign } from '@/types/index';

// Wave 1 backend integration only reports metrics for this campaign today —
// every other campaign shows "Not connected" until GA4/Infinity queries are
// scoped per-campaign (see Wave 1 Data Integration brief, Phase 3). Shared
// between CampaignSummaryTable and the Campaign Detail Performance tab so
// the same campaign is treated consistently in both places.
export function isWave1Campaign(campaign: Pick<Campaign, 'name'>): boolean {
  return campaign.name.trim().toLowerCase() === 'q3 education campaign';
}

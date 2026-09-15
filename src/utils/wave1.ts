import { Campaign } from '@/types/index';

// Legacy Wave 1 display selector for CampaignPerformanceTable (Performance
// and Reports). It is not the canonical attribution rule: Campaign Detail
// already uses explicit GA4 names, Google Ads IDs and Infinity landing paths.
// The retained Wave 1 name match must not be broadened into attribution.
export function isWave1Campaign(campaign: Pick<Campaign, 'name'>): boolean {
  return campaign.name.trim().toLowerCase() === 'q3 education campaign';
}

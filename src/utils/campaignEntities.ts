import type { Brand, Campaign } from '@/types/index';

// Membership is explicit when entities is populated; brand is a legacy fallback.
// Use includes/some inside filter so a campaign appears once in an aggregate.
export function getCampaignEntities(campaign: Pick<Campaign, 'entities' | 'brand'>): Brand[] {
  return campaign.entities?.length ? campaign.entities : [campaign.brand];
}

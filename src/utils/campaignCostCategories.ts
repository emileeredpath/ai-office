import type { CampaignCostCategory } from '@/types/index';

// Single source of truth for the Campaign Costs category list on the
// frontend — every add/edit form and filter must import this rather than
// hardcoding the list a second time. Must stay in lockstep with backend/
// src/types.ts's CAMPAIGN_COST_CATEGORIES (validated server-side by
// backend/src/routes/campaignCosts.ts's zod schema); the two runtimes have
// no shared package, so this is a deliberate, documented duplication, same
// convention already used for Brand between this file's type and the
// backend's own copy.
export const CAMPAIGN_COST_CATEGORIES: CampaignCostCategory[] = [
  'Purchased Data',
  'Print & Production',
  'Postage & Distribution',
  'Creative / Production',
  'Agency / Supplier',
  'Events',
  'Sponsorship',
  'Other',
];

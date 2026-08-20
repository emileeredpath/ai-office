import { CampaignStatus } from '@/types/index';

// Shared between Campaign Detail and the Campaigns table so status badges
// look identical in both places.
export const CAMPAIGN_STATUS_BADGE_STYLE: Record<CampaignStatus, { background: string; color: string }> = {
  active: { background: '#10b981', color: 'white' },
  completed: { background: '#9ca3af', color: 'white' },
  planning: { background: '#3b82f6', color: 'white' },
  'on-hold': { background: '#f59e0b', color: 'white' },
};

export const CAMPAIGN_STATUS_LABEL: Record<CampaignStatus, string> = {
  active: 'Active',
  completed: 'Completed',
  planning: 'Planning',
  'on-hold': 'On Hold',
};

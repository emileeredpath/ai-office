import { CampaignStatus } from '@/types/index';

export interface CampaignProgressInfo {
  percent: number;
  label: string;
}

// Shared by Campaign Detail and the Campaigns table so both screens agree on
// the same honest, date-based progress calculation — no invented data, just
// arithmetic over the campaign's own real start/end dates.
export function getCampaignProgressInfo(status: CampaignStatus, startDate: Date, endDate: Date): CampaignProgressInfo {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dayMs = 24 * 60 * 60 * 1000;

  if (status === 'completed') {
    const daysAgo = Math.round((now.getTime() - end.getTime()) / dayMs);
    return { percent: 100, label: daysAgo > 0 ? `Ended ${daysAgo}d ago` : 'Completed' };
  }
  if (now < start) {
    const daysUntil = Math.round((start.getTime() - now.getTime()) / dayMs);
    return { percent: 0, label: `Starts in ${daysUntil}d` };
  }
  if (now > end) {
    return { percent: 100, label: 'Past end date' };
  }
  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const percent = total > 0 ? Math.min(100, Math.max(0, Math.round((elapsed / total) * 100))) : 0;
  const daysRemaining = Math.max(0, Math.round((end.getTime() - now.getTime()) / dayMs));
  return { percent, label: `${daysRemaining}d remaining` };
}

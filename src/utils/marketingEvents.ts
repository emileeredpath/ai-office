import { Brand, Campaign, FundingRecord, Task } from '@/types/index';

// Genuine dated marketing activity, computed once and shared by Overview's
// "Coming Up" and the Content & Calendar page — no invented data, just a
// single place that reads real tasks/campaign milestones/funding deadlines
// consistently instead of three slightly-different copies of the same
// merge-and-sort logic.
export type MarketingEventKind = 'task' | 'email' | 'milestone' | 'funding' | 'campaign-start' | 'campaign-end';

export interface MarketingEvent {
  id: string;
  kind: MarketingEventKind;
  title: string;
  date: Date;
  brand: Brand;
  campaignId?: string;
  campaignName?: string;
  taskId?: string;
  fundingId?: string;
  subtitle?: string;
  completed?: boolean;
  colour?: string; // campaign's own colour, for campaign-start/end markers
}

export interface GetMarketingEventsParams {
  tasks: Task[];
  campaigns: Campaign[];
  fundingRecords: FundingRecord[];
  matchesSelectedEntity: (brand: Brand | null | undefined) => boolean;
  rangeStart?: Date | null;
  rangeEnd?: Date | null;
  // Default false to match the original "Coming Up" behaviour (forward-
  // looking, incomplete items only). Content & Calendar passes true since
  // it's a real calendar of what happened as well as what's ahead.
  includeCompleted?: boolean;
  // Default false. Content & Calendar opts in for campaign start/end
  // markers; Coming Up never had these, so it must stay off there to keep
  // that section's output unchanged.
  includeCampaignMarkers?: boolean;
}

function inRange(date: Date, start?: Date | null, end?: Date | null): boolean {
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
}

export function getMarketingEvents({
  tasks,
  campaigns,
  fundingRecords,
  matchesSelectedEntity,
  rangeStart = null,
  rangeEnd = null,
  includeCompleted = false,
  includeCampaignMarkers = false,
}: GetMarketingEventsParams): MarketingEvent[] {
  const events: MarketingEvent[] = [];

  for (const t of tasks) {
    if (!matchesSelectedEntity(t.brand)) continue;
    if (!t.deadline) continue;
    if (!includeCompleted && t.status === 'complete') continue;
    const date = new Date(t.deadline);
    if (!inRange(date, rangeStart, rangeEnd)) continue;
    const campaign = t.campaignId ? campaigns.find((c) => c.id === t.campaignId) : undefined;
    const isEmail = t.type === 'email-send';
    events.push({
      id: `task-${t.id}`,
      kind: isEmail ? 'email' : 'task',
      title: t.title,
      date,
      brand: t.brand,
      campaignId: t.campaignId || undefined,
      campaignName: campaign?.name,
      taskId: t.id,
      subtitle: isEmail && t.recipients ? `${t.recipients.toLocaleString()} recipients${t.cost != null ? ` · £${t.cost.toFixed(2)}` : ''}` : campaign?.name,
      completed: t.status === 'complete',
    });
  }

  for (const c of campaigns) {
    if (!matchesSelectedEntity(c.brand)) continue;

    for (const s of c.schedule || []) {
      if (!s.date) continue;
      if (!includeCompleted && s.status === 'complete') continue;
      const date = new Date(s.date);
      if (!inRange(date, rangeStart, rangeEnd)) continue;
      events.push({
        id: `milestone-${c.id}-${(s as any).id || s.date}-${s.element}`,
        kind: 'milestone',
        title: s.element,
        date,
        brand: c.brand,
        campaignId: c.id,
        campaignName: c.name,
        completed: s.status === 'complete',
      });
    }

    if (includeCampaignMarkers) {
      const start = new Date(c.startDate);
      if (inRange(start, rangeStart, rangeEnd)) {
        events.push({
          id: `campaign-start-${c.id}`,
          kind: 'campaign-start',
          title: `${c.name} starts`,
          date: start,
          brand: c.brand,
          campaignId: c.id,
          campaignName: c.name,
          colour: c.colour,
        });
      }
      const end = new Date(c.endDate);
      if (inRange(end, rangeStart, rangeEnd)) {
        events.push({
          id: `campaign-end-${c.id}`,
          kind: 'campaign-end',
          title: `${c.name} ends`,
          date: end,
          brand: c.brand,
          campaignId: c.id,
          campaignName: c.name,
          colour: c.colour,
        });
      }
    }
  }

  for (const r of fundingRecords) {
    if (r.archived) continue;
    if (!matchesSelectedEntity(r.brand)) continue;
    if (!r.claimDeadline) continue;
    if (r.claimStatus !== 'eligible' && r.claimStatus !== 'submitted') continue;
    const date = new Date(r.claimDeadline);
    if (!inRange(date, rangeStart, rangeEnd)) continue;
    events.push({
      id: `funding-${r.id}`,
      kind: 'funding',
      title: `${r.vendor} funding claim due`,
      date,
      brand: r.brand,
      fundingId: r.id,
      subtitle: r.schemeName,
    });
  }

  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}

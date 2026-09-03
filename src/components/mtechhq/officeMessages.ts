import type { Task, Campaign, Brand } from '@/types/index';
import type { EmailPerformanceResponse } from '@/services/emailPerformanceApi';

// Every message here is derived from the exact same store data the 2D
// dashboard already reads (tasks/campaigns/emailPerformance) — nothing is
// invented, and nothing is computed a second, separately-maintained way.
// See DATA_INTEGRITY.md: a statement is only ever shown if the underlying
// real data supports it, and a genuine "nothing to report" always gets an
// honest neutral line, never silence and never an invented one to make
// the office feel busier than it is.

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function countTasksDueThisWeek(tasks: Task[], matchesSelectedEntity: (brand: Brand | null | undefined) => boolean): number {
  const now = Date.now();
  return tasks.filter(
    (t) => matchesSelectedEntity(t.brand) && t.status !== 'complete' && t.deadline && t.deadline.getTime() >= now && t.deadline.getTime() <= now + WEEK_MS
  ).length;
}

export function countActiveCampaigns(campaigns: Campaign[], matchesSelectedEntity: (brand: Brand | null | undefined) => boolean): number {
  return campaigns.filter((c) => matchesSelectedEntity(c.brand) && c.status === 'active').length;
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

// null = genuinely unknown (Campaign Monitor not connected) — distinct
// from a real, confirmed zero. Callers must not present these the same
// way; see buildOfficeMessages below.
export function countEducationEmailsSentToday(
  emailPerformance: EmailPerformanceResponse | null,
  matchesSelectedEntity: (brand: Brand | null | undefined) => boolean
): number | null {
  if (!emailPerformance || !emailPerformance.configured) return null;
  return emailPerformance.campaigns.filter(
    (c) => matchesSelectedEntity(c.brand) && c.emailCampaignGroup === 'education_2026' && isToday(c.sentDate)
  ).length;
}

export interface OfficeMessageInputs {
  tasks: Task[];
  campaigns: Campaign[];
  emailPerformance: EmailPerformanceResponse | null;
  matchesSelectedEntity: (brand: Brand | null | undefined) => boolean;
  userName: string;
}

// Builds the character's/boards' rotating set of genuine statements. Order
// is greeting, then tasks, then campaigns, then (only if the data source
// is actually connected) Education email sends today.
export function buildOfficeMessages(inputs: OfficeMessageInputs): string[] {
  const { tasks, campaigns, emailPerformance, matchesSelectedEntity, userName } = inputs;
  const messages: string[] = [`Hi ${userName} 👋`];

  const tasksDue = countTasksDueThisWeek(tasks, matchesSelectedEntity);
  messages.push(tasksDue > 0 ? `You have ${tasksDue} task${tasksDue === 1 ? '' : 's'} due this week.` : 'No tasks due this week.');

  const activeCampaigns = countActiveCampaigns(campaigns, matchesSelectedEntity);
  messages.push(activeCampaigns > 0 ? `${activeCampaigns} campaign${activeCampaigns === 1 ? ' is' : 's are'} currently active.` : 'No active campaigns.');

  const educationSentToday = countEducationEmailsSentToday(emailPerformance, matchesSelectedEntity);
  if (educationSentToday !== null) {
    messages.push(
      educationSentToday > 0
        ? `${educationSentToday} Education email${educationSentToday === 1 ? '' : 's'} sent today.`
        : 'No Education emails sent today.'
    );
  }

  return messages;
}

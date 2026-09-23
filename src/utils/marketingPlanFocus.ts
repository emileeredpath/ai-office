import type { Brand } from '@/types';
import type { MarketingPlan, MarketingPlanStrategyObjective } from '@/types/marketingPlan';

export interface MarketingPlanFocusItem {
  id: string;
  kind: string;
  title: string;
  detail: string;
  overdue: boolean;
  sortDate: string | null;
  objectiveId?: string;
}

function localDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function formatDate(value: string) {
  return localDate(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function titleCase(value: string) {
  return value.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getCurrentQuarter(today = new Date()) {
  return Math.floor(today.getMonth() / 3) + 1;
}

export function selectHomeMarketingPlan(plans: MarketingPlan[], today = new Date()) {
  return plans.find((plan) => plan.periodYear === today.getFullYear()) ?? plans[0] ?? null;
}

export function filterStrategyForEntity(rows: MarketingPlanStrategyObjective[], selectedEntity: Brand | 'all') {
  if (selectedEntity === 'all') return rows;
  return rows.filter((row) => row.objective.entities.includes(selectedEntity));
}

export function getQuarterStrategyRows(plan: MarketingPlan, rows: MarketingPlanStrategyObjective[], today = new Date()) {
  const quarter = plan.periodYear === today.getFullYear() ? getCurrentQuarter(today) : 1;
  return {
    quarter,
    rows: rows.filter((row) => row.objective.periodYear === plan.periodYear && row.objective.quarter === quarter),
  };
}

export function getMarketingPlanWeekFocus(plan: MarketingPlan, rows: MarketingPlanStrategyObjective[], today = new Date()) {
  const now = new Date(today);
  now.setHours(0, 0, 0, 0);
  const start = new Date(now);
  const day = (now.getDay() + 6) % 7;
  start.setDate(now.getDate() - day);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const items: MarketingPlanFocusItem[] = [];

  for (const row of rows) {
    for (const milestone of row.milestones) {
      if (milestone.status === 'complete') continue;
      const due = milestone.dueDate ? localDate(milestone.dueDate) : null;
      const starts = milestone.startDate ? localDate(milestone.startDate) : null;
      const relevant = milestone.level === 'current-focus'
        || milestone.attentionType !== null
        || (due !== null && due <= end)
        || (starts !== null && starts >= start && starts <= end);
      if (!relevant) continue;
      items.push({
        id: milestone.id,
        kind: milestone.attentionType ? titleCase(milestone.attentionType) : milestone.level === 'current-focus' ? 'Current focus' : 'Milestone',
        title: milestone.title,
        detail: `${row.objective.title}${milestone.dueDate ? ` · Due ${formatDate(milestone.dueDate)}` : ''}`,
        overdue: due !== null && due < start,
        sortDate: milestone.dueDate ?? milestone.startDate,
        objectiveId: row.objective.id,
      });
    }
    if (row.objective.nextReviewDate) {
      const review = localDate(row.objective.nextReviewDate);
      if (review <= end) items.push({
        id: `objective-${row.objective.id}`,
        kind: 'Review required',
        title: row.objective.title,
        detail: `Objective review · ${formatDate(row.objective.nextReviewDate)}`,
        overdue: review < start,
        sortDate: row.objective.nextReviewDate,
        objectiveId: row.objective.id,
      });
    }
  }
  if (plan.nextReviewDate) {
    const review = localDate(plan.nextReviewDate);
    if (review <= end) items.push({
      id: `plan-${plan.id}`,
      kind: 'Review required',
      title: plan.title,
      detail: `Plan review · ${formatDate(plan.nextReviewDate)}`,
      overdue: review < start,
      sortDate: plan.nextReviewDate,
    });
  }

  items.sort((a, b) => Number(b.overdue) - Number(a.overdue)
    || (a.sortDate ?? '9999-12-31').localeCompare(b.sortDate ?? '9999-12-31')
    || a.title.localeCompare(b.title));
  return { start, end, items };
}

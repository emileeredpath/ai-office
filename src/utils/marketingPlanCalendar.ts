import type { Brand } from '@/types';
import type { MarketingPlan, MarketingPlanStrategyObjective } from '@/types/marketingPlan';
import type { MarketingEvent } from '@/utils/marketingEvents';

interface MarketingPlanCalendarParams {
  plan: MarketingPlan | null;
  strategy: MarketingPlanStrategyObjective[];
  selectedEntity: Brand | 'all';
  rangeStart?: Date | null;
  rangeEnd?: Date | null;
}

function localDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function inRange(date: Date, start?: Date | null, end?: Date | null): boolean {
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
}

function eventBrand(row: MarketingPlanStrategyObjective, selectedEntity: Brand | 'all'): Brand {
  if (selectedEntity !== 'all') return selectedEntity;
  return row.objective.entities[0] ?? 'mtech';
}

// Only exact dates saved in the Marketing Plan become calendar entries.
// Quarter/month fields without a start or due date remain in the plan rather
// than being assigned an invented day.
export function getMarketingPlanCalendarEvents({
  plan,
  strategy,
  selectedEntity,
  rangeStart = null,
  rangeEnd = null,
}: MarketingPlanCalendarParams): MarketingEvent[] {
  if (!plan) return [];

  const events: MarketingEvent[] = [];
  const rows = selectedEntity === 'all'
    ? strategy
    : strategy.filter((row) => row.objective.entities.includes(selectedEntity));

  for (const row of rows) {
    const brand = eventBrand(row, selectedEntity);

    for (const milestone of row.milestones) {
      if (milestone.archived) continue;
      const shared = {
        brand,
        planId: plan.id,
        objectiveId: row.objective.id,
        milestoneId: milestone.id,
        completed: milestone.status === 'complete',
      };

      if (milestone.startDate && milestone.startDate !== milestone.dueDate) {
        const date = localDate(milestone.startDate);
        if (inRange(date, rangeStart, rangeEnd)) events.push({
          ...shared,
          id: `plan-milestone-start-${milestone.id}`,
          kind: 'plan-milestone',
          title: `${milestone.title} starts`,
          date,
          subtitle: `${row.objective.title} · Marketing Plan`,
        });
      }

      if (milestone.dueDate) {
        const date = localDate(milestone.dueDate);
        if (inRange(date, rangeStart, rangeEnd)) events.push({
          ...shared,
          id: `plan-milestone-due-${milestone.id}`,
          kind: 'plan-milestone',
          title: milestone.title,
          date,
          subtitle: `${row.objective.title} · Marketing Plan due date`,
        });
      }
    }

    if (row.objective.nextReviewDate) {
      const date = localDate(row.objective.nextReviewDate);
      if (inRange(date, rangeStart, rangeEnd)) events.push({
        id: `plan-objective-review-${row.objective.id}`,
        kind: 'plan-review',
        title: `${row.objective.title} review`,
        date,
        brand,
        planId: plan.id,
        objectiveId: row.objective.id,
        subtitle: `${plan.title} · Objective review`,
      });
    }
  }

  // The plan review is group-wide. Entity views show objective dates scoped
  // to that entity rather than repeating the group review in every view.
  if (selectedEntity === 'all' && plan.nextReviewDate) {
    const date = localDate(plan.nextReviewDate);
    if (inRange(date, rangeStart, rangeEnd)) events.push({
      id: `plan-review-${plan.id}`,
      kind: 'plan-review',
      title: `${plan.title} review`,
      date,
      brand: 'mtech',
      planId: plan.id,
      subtitle: 'Marketing Plan review',
    });
  }

  return events.sort((a, b) => a.date.getTime() - b.date.getTime() || a.title.localeCompare(b.title));
}

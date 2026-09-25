import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';

const bundled = await build({
  entryPoints: ['src/utils/marketingPlanCalendar.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
});
const { getMarketingPlanCalendarEvents } = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);

const plan = {
  id: 'plan-1', title: '2027 Marketing Plan', periodYear: 2027, nextReviewDate: '2027-04-30',
};

function row({ id = 'objective-1', entities = ['brentwood'], nextReviewDate = '2027-04-25', milestones = [] } = {}) {
  return {
    objective: { id, title: `Objective ${id}`, entities, nextReviewDate },
    milestones,
    priorities: [], campaignLinks: [], kpis: [],
  };
}

function milestone(overrides = {}) {
  return {
    id: 'milestone-1', title: 'Publish campaign page', startDate: '2027-04-10', dueDate: '2027-04-18',
    status: 'in-progress', archived: false, month: null, quarter: 2, ...overrides,
  };
}

test('calendar uses only exact saved Marketing Plan dates', () => {
  const events = getMarketingPlanCalendarEvents({
    plan,
    strategy: [row({ milestones: [
      milestone(),
      milestone({ id: 'month-only', title: 'Month only', startDate: null, dueDate: null, month: 4 }),
      milestone({ id: 'same-day', title: 'Single date', startDate: '2027-04-20', dueDate: '2027-04-20' }),
      milestone({ id: 'archived', title: 'Archived', archived: true }),
    ] })],
    selectedEntity: 'all',
  });

  assert.deepEqual(events.map((event) => event.id), [
    'plan-milestone-start-milestone-1',
    'plan-milestone-due-milestone-1',
    'plan-milestone-due-same-day',
    'plan-objective-review-objective-1',
    'plan-review-plan-1',
  ]);
  assert.ok(events.every((event) => event.kind === 'plan-milestone' || event.kind === 'plan-review'));
  assert.ok(!events.some((event) => event.title === 'Month only' || event.title === 'Archived'));
});

test('objective dates respect entity scope and group plan reviews stay group-only', () => {
  const strategy = [
    row({ id: 'shared', entities: ['brentwood', 'radio-links'], milestones: [milestone()] }),
    row({ id: 'capcom', entities: ['capcom'], milestones: [milestone({ id: 'capcom-milestone' })] }),
    row({ id: 'unassigned', entities: [], milestones: [milestone({ id: 'unassigned-milestone' })] }),
  ];

  const radioLinks = getMarketingPlanCalendarEvents({ plan, strategy, selectedEntity: 'radio-links' });
  assert.ok(radioLinks.some((event) => event.objectiveId === 'shared'));
  assert.ok(radioLinks.every((event) => event.objectiveId === 'shared'));
  assert.ok(!radioLinks.some((event) => event.id === 'plan-review-plan-1'));

  const group = getMarketingPlanCalendarEvents({ plan, strategy, selectedEntity: 'all' });
  assert.ok(group.some((event) => event.objectiveId === 'unassigned'));
  assert.ok(group.some((event) => event.id === 'plan-review-plan-1'));
});

test('Marketing Plan calendar dates respect the visible calendar range', () => {
  const events = getMarketingPlanCalendarEvents({
    plan,
    strategy: [row({ milestones: [milestone()] })],
    selectedEntity: 'all',
    rangeStart: new Date('2027-04-15T00:00:00'),
    rangeEnd: new Date('2027-04-22T23:59:59'),
  });

  assert.deepEqual(events.map((event) => event.id), [
    'plan-milestone-due-milestone-1',
  ]);
});

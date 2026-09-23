import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { build } from 'esbuild';

const bundled = await build({ entryPoints: ['src/utils/marketingPlanFocus.ts'], bundle: true, platform: 'node', format: 'esm', write: false });
const { filterStrategyForEntity, getMarketingPlanWeekFocus, getQuarterStrategyRows, selectMarketingPlanForCurrentPeriod } = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);

const plan = { id: 'plan-1', title: '2027 plan', periodYear: 2027, nextReviewDate: null };
const objective = { id: 'objective-1', title: 'Grow relevant demand', periodYear: 2027, quarter: 2, entities: ['brentwood'], nextReviewDate: null };
const row = {
  objective,
  priorities: [{ id: 'priority-1' }],
  campaignLinks: [],
  kpis: [],
  milestones: [{
    id: 'milestone-1', level: 'current-focus', title: 'Publish landing page', status: 'in-progress',
    startDate: null, dueDate: '2027-04-14', attentionType: null,
  }],
};

test('home selects the current-year plan without fabricating one', () => {
  assert.equal(selectMarketingPlanForCurrentPeriod([{ ...plan, periodYear: 2026 }, plan], new Date('2027-04-12')).id, 'plan-1');
  assert.equal(selectMarketingPlanForCurrentPeriod([], new Date('2027-04-12')), null);
});

test('home focus honours objective entity scope and exact quarter', () => {
  assert.deepEqual(filterStrategyForEntity([row], 'brentwood'), [row]);
  assert.deepEqual(filterStrategyForEntity([row], 'capcom'), []);
  const result = getQuarterStrategyRows(plan, [row], new Date('2027-04-12'));
  assert.equal(result.quarter, 2);
  assert.deepEqual(result.rows, [row]);
});

test('week focus is derived from saved plan records and preserves overdue state', () => {
  const result = getMarketingPlanWeekFocus(plan, [row], new Date('2027-04-15'));
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].title, 'Publish landing page');
  assert.equal(result.items[0].overdue, false);
  const overdue = getMarketingPlanWeekFocus(plan, [row], new Date('2027-04-19'));
  assert.equal(overdue.items[0].overdue, true);
});

test('sidebar links directly to Microsoft To Do and does not present internal tasks as My Tasks', () => {
  const app = readFileSync('src/App.tsx', 'utf8');
  const sidebar = readFileSync('src/components/layout/Sidebar.tsx', 'utf8');
  assert.match(app, /label: 'Microsoft To Do', externalUrl: 'https:\/\/to-do\.office\.com\/tasks\/'/);
  assert.doesNotMatch(app, /label: 'My Tasks'/);
  assert.match(sidebar, /target="_blank"/);
  assert.match(sidebar, /rel="noopener noreferrer"/);
});

test('Marketing Plan distinguishes failed reads and exposes an accessible tab relationship', () => {
  const home = readFileSync('src/screens/HomeScreen.tsx', 'utf8');
  const screen = readFileSync('src/screens/MarketingPlanScreen.tsx', 'utf8');
  assert.match(home, /Marketing Plan data is unavailable right now/);
  assert.match(screen, /Marketing Plan unavailable/);
  assert.match(screen, /role="tablist"/);
  assert.match(screen, /aria-controls={`marketing-plan-panel-\$\{value}`}/);
  assert.match(screen, /role="tabpanel"/);
  assert.match(screen, /event\.key === 'ArrowRight'/);
});

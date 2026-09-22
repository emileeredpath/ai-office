import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';

const bundled = await build({ entryPoints: ['src/utils/marketingPlanProgress.ts'], bundle: true, platform: 'node', format: 'esm', write: false });
const {
  compareMarketingPlanTarget, getStrategyHealthFindings, resolveMarketingPlanActual,
  resolveMarketingPlanEntityScope, resolveMarketingPlanPeriod,
} = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);

const objective = {
  id: 'objective-1', planId: 'plan-1', title: 'Grow qualified demand', description: '', status: 'approved', priority: 'high',
  periodYear: 2027, quarter: 2, whyItMatters: '', customerMarketContext: '', commercialRelevance: '', marketingRationale: '',
  nextReviewDate: null, sortOrder: 0, notes: '', entities: ['brentwood'], createdAt: '', updatedAt: '', archived: false, archivedAt: null,
};
const kpi = { id: 'kpi-1', objectiveId: objective.id, kpiKey: 'website-users', targetValue: 10, targetUnit: 'count', targetDirection: 'reach', targetStatus: 'approved', periodScope: 'objective', sortOrder: 0, notes: '', createdAt: '', updatedAt: '' };

test('objective period uses exact calendar quarter and prior quarter', () => {
  assert.deepEqual(resolveMarketingPlanPeriod(objective, kpi), {
    status: 'available', startDate: '2027-04-01', endDate: '2027-06-30', previousStartDate: '2027-01-01', previousEndDate: '2027-03-31', label: 'Q2 2027', allTime: false,
  });
  const month = resolveMarketingPlanPeriod(objective, { ...kpi, periodScope: 'month' });
  assert.equal(month.status, 'unavailable');
  assert.match(month.reason, /does not identify which month/);
});

test('entity scope accepts one entity and the established group only', () => {
  assert.equal(resolveMarketingPlanEntityScope(['brentwood']).selectedEntity, 'brentwood');
  assert.equal(resolveMarketingPlanEntityScope(['ircl', 'capcom', 'radio-links', 'brentwood']).isGroupView, true);
  assert.equal(resolveMarketingPlanEntityScope(['brentwood', 'capcom']).status, 'unavailable');
  assert.equal(resolveMarketingPlanEntityScope([]).status, 'unavailable');
});

test('canonical GA4 actual preserves genuine zero and missing as unavailable', () => {
  const data = { configured: true, configuredBrands: ['brentwood'], brands: [{ brand: 'brentwood', activeUsers: 0, sessions: 0 }] };
  const actual = resolveMarketingPlanActual('website-users', objective, kpi, [], [], { ga4Traffic: data });
  assert.equal(actual.availability, 'available');
  assert.equal(actual.value, 0);
  assert.equal(compareMarketingPlanTarget(actual, kpi), 'below');
  const missing = resolveMarketingPlanActual('website-users', objective, kpi, [], [], { ga4Traffic: null });
  assert.equal(missing.availability, 'unavailable');
  assert.equal(missing.value, null);
  assert.equal(compareMarketingPlanTarget({ ...actual, value: 11 }, { ...kpi, targetDirection: 'maintain' }), 'above');
});

test('manual campaign actuals use explicit links and exact overlap period', () => {
  const campaigns = [
    { id: 'in', startDate: new Date('2027-04-10'), endDate: new Date('2027-04-30'), leads: 4, results: { enquiriesReceived: 3 } },
    { id: 'out', startDate: new Date('2027-01-01'), endDate: new Date('2027-01-31'), leads: 8, results: { enquiriesReceived: 7 } },
  ];
  const actual = resolveMarketingPlanActual('marketing-leads', objective, { ...kpi, kpiKey: 'marketing-leads' }, ['in', 'out'], campaigns, {});
  assert.equal(actual.value, 4);
  assert.equal(actual.previousValue, 8);
});

test('health is factual and links each gap to its objective', () => {
  const overdue = { ...objective, quarter: null, entities: [], nextReviewDate: '2020-01-01' };
  const findings = getStrategyHealthFindings([{ objective: overdue, priorities: [], milestones: [], campaignLinks: [], kpis: [] }], {}, new Date('2027-01-01'));
  assert.ok(findings.some((item) => item.title === 'No KPI linked'));
  assert.ok(findings.some((item) => item.title === 'Objective review overdue'));
  assert.ok(findings.some((item) => item.title === 'Quarter TBC'));
  assert.ok(findings.every((item) => item.objectiveId === objective.id));
});

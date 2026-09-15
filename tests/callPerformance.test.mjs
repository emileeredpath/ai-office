import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';

const bundled = await build({ entryPoints: ['src/utils/callPerformance.ts'], bundle: true, platform: 'node', format: 'esm', write: false });
const { getCallPerformance, getCallSourceBreakdown, resolveCallDateRange } = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);
const call = (brand, callStage = 'bridge') => ({ brand, callStage, bridgeDuration: 60, chType: 'seo' });
const data = { configured: true, mappedBrands: ['brentwood', 'radio-links', 'idaro'], errors: [], calls: [call('brentwood'), call('radio-links'), call('radio-links', 'ring'), call('idaro'), call(null)] };

test('general call totals use confirmed entity mapping, not campaign membership', () => {
  const entity = getCallPerformance(data, false, 'radio-links');
  assert.equal(entity.totalCalls, 2);
  assert.equal(entity.answeredCalls, 1);
  assert.equal(entity.missedCalls, 1);
  assert.equal(getCallPerformance(data, true, 'all').totalCalls, 3);
  assert.equal(getCallPerformance(data, false, 'capcom').status, 'not-connected');
  assert.equal(getCallSourceBreakdown(data, false, 'radio-links').buckets.reduce((sum, bucket) => sum + bucket.calls, 0), entity.totalCalls);
});

test('successful zero, disconnected source and failed empty read remain distinct', () => {
  const empty = { ...data, calls: [] };
  assert.equal(getCallPerformance(empty, false, 'radio-links').totalCalls, 0);
  assert.equal(getCallPerformance(null, true, 'all').totalCalls, undefined);
  const failed = { ...empty, errors: ['Test fetch failure'] };
  assert.equal(getCallPerformance(failed, true, 'all').status, 'not-connected');
  assert.equal(getCallPerformance(failed, true, 'all').totalCalls, undefined);
  assert.equal(getCallSourceBreakdown(failed, true, 'all').status, 'not-connected');
});

test('partial non-empty results retain real calls without removing the source warning', () => {
  const partial = { ...data, errors: ['Test pagination warning'] };
  assert.equal(getCallPerformance(partial, false, 'radio-links').totalCalls, 2);
  assert.deepEqual(partial.errors, ['Test pagination warning']);
});

test('period resolution preserves the existing all-time query and selected month', () => {
  const now = new Date('2026-09-15T12:00:00Z');
  assert.equal(resolveCallDateRange('all-time', now).startDate, '2000-01-01');
  assert.equal(resolveCallDateRange('this-month', now).startDate, new Date(2026, 8, 1).toISOString().slice(0, 10));
  assert.equal(resolveCallDateRange('this-month', now).endDate, '2026-09-15');
});

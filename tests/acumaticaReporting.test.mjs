import assert from 'node:assert/strict';
import { test } from 'node:test';

// Isolated test fixtures only: never opens an application database.
process.env.DATABASE_PATH = ':memory:';
const { importAcumaticaCsv } = await import('../backend/dist/services/acumaticaImport.js');
const { getAcumaticaSummary } = await import('../backend/dist/services/acumaticaReporting.js');
const { getAllOpportunities } = await import('../backend/dist/db/acumaticaRepository.js');
const imported = importAcumaticaCsv('regression-fixture.csv', [
  'Opportunity ID,Created On,Status,Stage,Total,Estimated Close Date,Source Lead',
  'RL-test-1,2026-09-01,Won,Open,100,2026-12-01,excluded-test-value',
  'RL-test-2,2026-08-01,Won,Won,200,2026-09-01,excluded-test-value',
  'RL-test-3,2026-09-02,Open,Won,300,2026-09-03,excluded-test-value',
  'RL-test-4,2026-09-03,New,Won,400,2026-09-03,excluded-test-value',
  'RL-test-5,,Won,Won,500,2026-09-03,excluded-test-value',
].join('\n'));

test('Won Revenue uses Created On and current Status, never Stage or estimated close', () => {
  assert.equal(imported.processed, 5);
  const summary = getAcumaticaSummary('2026-09-01', '2026-09-30', 'radio-links');
  assert.equal(summary.wonRevenue, 100);
  assert.equal(summary.wonDeals, 1);
  assert.equal(summary.openPipelineValue, 700);
  assert.equal(summary.openPipelineCount, 2);
  assert.equal(summary.undated, 1);
  assert.equal(getAcumaticaSummary(undefined, undefined, 'radio-links').wonRevenue, 800);
});

test('missing coverage, real period zero and IRCL availability remain distinct', () => {
  const genuinePeriodZero = getAcumaticaSummary('2027-01-01', '2027-01-31', 'radio-links');
  assert.equal(genuinePeriodZero.hasAnyImportedData, true);
  assert.equal(genuinePeriodZero.hasImportedData, true);
  assert.equal(genuinePeriodZero.wonRevenue, 0);

  const missingEntityCoverage = getAcumaticaSummary(undefined, undefined, 'capcom');
  assert.equal(missingEntityCoverage.hasAnyImportedData, true);
  assert.equal(missingEntityCoverage.hasImportedData, false);
  assert.equal(getAcumaticaSummary(undefined, undefined, 'ircl').notAvailableForBrand, true);
});

test('Source Lead is ignored and never persisted', () => {
  assert(imported.ignoredPersonalDataColumns.includes('Source Lead'));
  assert(!JSON.stringify(getAllOpportunities()).includes('excluded-test-value'));
});

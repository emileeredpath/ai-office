import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';

const bundled = await build({ entryPoints: ['src/utils/campaignCosts.ts'], bundle: true, platform: 'node', format: 'esm', write: false });
const { getKnownCampaignSpend, sumKnownCampaignSpend } = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);

test('structured costs replace legacy spend, including genuine structured zero', () => {
  assert.equal(getKnownCampaignSpend([{ campaignId: 'test', amount: 25 }], 'test', 100, null).knownCampaignSpend, 25);
  assert.equal(getKnownCampaignSpend([{ campaignId: 'test', amount: 0 }], 'test', 100, null).knownCampaignSpend, 0);
});

test('legacy fallback and genuinely empty costs remain distinct', () => {
  assert.equal(getKnownCampaignSpend([], 'test', 100, null).isLegacyFallback, true);
  const empty = getKnownCampaignSpend([], 'test', 0, null);
  assert.equal(empty.knownCampaignSpend, 0);
  assert.equal(empty.fixedCostsSource, 'none');
  assert.equal(empty.mediaSpendStatus, 'not-connected');
});

test('only available media contributes, with missing and genuine zero states preserved', () => {
  assert.equal(getKnownCampaignSpend([], 'test', 10, { status: 'available', spend: 20 }).knownCampaignSpend, 30);
  for (const status of ['unmapped', 'not-connected']) {
    const result = getKnownCampaignSpend([], 'test', 10, { status, spend: 20 });
    assert.equal(result.knownCampaignSpend, 10);
    assert.equal(result.mediaSpendStatus, status);
  }
  assert.equal(getKnownCampaignSpend([], 'test', 0, { status: 'available', spend: 0 }).mediaSpendStatus, 'available');
});

test('canonical aggregate reconciles without adding legacy to structured costs', () => {
  const result = sumKnownCampaignSpend([{ id: 'a', spend: 100 }, { id: 'b', spend: 50 }], [{ campaignId: 'a', amount: 25 }], null);
  assert.equal(result.total, 75);
  assert.equal(result.fixedCosts + result.mediaSpend, result.total);
  assert.equal(result.hasLegacyFallback, true);
});

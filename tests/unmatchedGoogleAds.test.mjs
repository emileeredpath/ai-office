import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';

const bundled = await build({ entryPoints: ['src/utils/unmatchedGoogleAds.ts'], bundle: true, platform: 'node', format: 'esm', write: false });
const { filterUnmatchedGoogleAdsByEntity, prioritiseUnmatchedGoogleAds, searchUnmatchedGoogleAds } = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);

const rows = [
  { campaignId: 'rl-zero', campaignName: 'Radio Links old', brand: 'radio-links', spend: 0 },
  { campaignId: 'bc-low', campaignName: 'Brentwood maintenance', brand: 'brentwood', spend: 25 },
  { campaignId: 'bc-high', campaignName: 'Brentwood hire', brand: 'brentwood', spend: 125 },
  { campaignId: 'bc-zero', campaignName: 'Brentwood old', brand: 'brentwood', spend: 0 },
];

test('unmatched Google Ads rows respect the selected entity', () => {
  const brentwood = filterUnmatchedGoogleAdsByEntity(rows, (brand) => brand === 'brentwood');
  assert.deepEqual(brentwood.map((row) => row.campaignId), ['bc-low', 'bc-high', 'bc-zero']);
  assert.equal(filterUnmatchedGoogleAdsByEntity(rows, () => true).length, 4);
});

test('spend-bearing campaigns are prioritised without discarding genuine zeros', () => {
  const result = prioritiseUnmatchedGoogleAds(rows);
  assert.deepEqual(result.withSpend.map((row) => row.campaignId), ['bc-high', 'bc-low']);
  assert.deepEqual(result.zeroSpend.map((row) => row.campaignId), ['bc-zero', 'rl-zero']);
});

test('campaign search is case-insensitive and preserves the prioritised rows', () => {
  const prioritised = prioritiseUnmatchedGoogleAds(rows).withSpend;
  assert.deepEqual(searchUnmatchedGoogleAds(prioritised, 'HIRE').map((row) => row.campaignId), ['bc-high']);
  assert.equal(searchUnmatchedGoogleAds(prioritised, '  ').length, 2);
});

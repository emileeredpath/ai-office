import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getCampaignEntities } from '../src/utils/campaignEntities.ts';

test('explicit membership replaces primary brand and includes each campaign once', () => {
  const campaign = { brand: 'mtech', entities: ['brentwood', 'radio-links', 'capcom', 'ircl'] };
  const campaigns = [campaign];
  for (const entity of campaign.entities) {
    assert.deepEqual(campaigns.filter(c => getCampaignEntities(c).includes(entity)), [campaign]);
  }
  assert.equal(campaigns.filter(c => getCampaignEntities(c).includes('mtech')).length, 0);
  assert.equal(campaigns.filter(c => getCampaignEntities(c).some(() => true)).length, 1);
  assert.deepEqual(campaign.entities, ['brentwood', 'radio-links', 'capcom', 'ircl']);
});

test('empty or absent entities preserves legacy membership', () => {
  for (const entities of [undefined, null, []]) {
    assert.deepEqual(getCampaignEntities({ brand: 'brentwood', entities }), ['brentwood']);
  }
});

test('repeated membership never duplicates a filtered campaign', () => {
  const campaigns = [{ brand: 'mtech', entities: ['capcom', 'capcom'] }];
  assert.equal(campaigns.filter(c => getCampaignEntities(c).includes('capcom')).length, 1);
});

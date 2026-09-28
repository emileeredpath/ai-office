import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';

const bundled = await build({
  entryPoints: ['backend/src/services/googleAds.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
});
const { GOOGLE_ADS_CONFIGURABLE_BRANDS } = await import(
  `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`
);

test('Google Ads supports only entity accounts with confirmed access', () => {
  assert.deepEqual(GOOGLE_ADS_CONFIGURABLE_BRANDS, ['brentwood', 'radio-links', 'ircl']);
  assert.equal(GOOGLE_ADS_CONFIGURABLE_BRANDS.includes('capcom'), false);
});

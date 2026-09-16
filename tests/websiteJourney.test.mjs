import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';

const bundled = await build({ entryPoints: ['src/utils/websiteJourney.ts'], bundle: true, platform: 'node', format: 'esm', write: false });
const { getWebsiteJourneyPages, getEntryPageEngagement } = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);

const data = {
  configured: true,
  configuredBrands: ['brentwood', 'radio-links', 'idaro'],
  enquiryConfiguredBrands: ['brentwood', 'radio-links'],
  brands: [
    { brand: 'brentwood', entryPages: [{ pagePath: '/contact/', sessions: 8, users: 7, engagedSessions: 5, bounceRate: 0.375 }], topPages: [], enquiryPages: [{ pagePath: '/contact/', enquiries: 0 }] },
    { brand: 'radio-links', entryPages: [{ pagePath: '/contact/', sessions: 3, users: 2, engagedSessions: 0, bounceRate: 1 }], topPages: null, enquiryPages: null },
    { brand: 'idaro', entryPages: [{ pagePath: '/contact/', sessions: 20, users: 18, engagedSessions: 15, bounceRate: 0.25 }], topPages: [], enquiryPages: null },
  ],
};

test('group page paths remain separate by entity and exclude IDARO', () => {
  const result = getWebsiteJourneyPages(data, true, 'all', 'entryPages');
  assert.equal(result.status, 'available');
  assert.deepEqual(result.rows.map((row) => [row.brand, row.pagePath, row.count]), [
    ['brentwood', '/contact/', 8], ['radio-links', '/contact/', 3],
  ]);
});

test('entry engagement keeps the GA4 rate and its session denominator in entity scope', () => {
  const group = getEntryPageEngagement(data, true, 'all');
  assert.deepEqual(group.rows.map((row) => [row.brand, row.sessions, row.engagedSessions, row.bounceRate]), [
    ['brentwood', 8, 5, 0.375], ['radio-links', 3, 0, 1],
  ]);
  assert.equal(getEntryPageEngagement(data, false, 'idaro').rows[0].bounceRate, 0.25);
  assert.equal(getEntryPageEngagement(null, true, 'all').status, 'not-connected');
});

test('a verified zero remains available while an unavailable report does not become zero', () => {
  const zero = getWebsiteJourneyPages(data, false, 'brentwood', 'enquiryPages');
  assert.equal(zero.status, 'available');
  assert.equal(zero.rows[0].count, 0);
  assert.equal(getWebsiteJourneyPages(data, false, 'radio-links', 'enquiryPages').status, 'not-connected');
  assert.equal(getWebsiteJourneyPages(data, false, 'idaro', 'enquiryPages').status, 'not-connected');
  assert.equal(getWebsiteJourneyPages(data, false, 'radio-links', 'topPages').status, 'not-connected');
});

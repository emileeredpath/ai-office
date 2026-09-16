import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';

const bundled = await build({ entryPoints: ['src/utils/websiteJourney.ts'], bundle: true, platform: 'node', format: 'esm', write: false });
const { getWebsiteJourneyPages } = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);

const data = {
  configured: true,
  configuredBrands: ['brentwood', 'radio-links', 'idaro'],
  enquiryConfiguredBrands: ['brentwood', 'radio-links'],
  brands: [
    { brand: 'brentwood', entryPages: [{ pagePath: '/contact/', sessions: 8, users: 7 }], topPages: [], enquiryPages: [{ pagePath: '/contact/', enquiries: 0 }] },
    { brand: 'radio-links', entryPages: [{ pagePath: '/contact/', sessions: 3, users: 2 }], topPages: null, enquiryPages: null },
    { brand: 'idaro', entryPages: [{ pagePath: '/contact/', sessions: 20, users: 18 }], topPages: [], enquiryPages: null },
  ],
};

test('group page paths remain separate by entity and exclude IDARO', () => {
  const result = getWebsiteJourneyPages(data, true, 'all', 'entryPages');
  assert.equal(result.status, 'available');
  assert.deepEqual(result.rows.map((row) => [row.brand, row.pagePath, row.count]), [
    ['brentwood', '/contact/', 8], ['radio-links', '/contact/', 3],
  ]);
});

test('a verified zero remains available while an unavailable report does not become zero', () => {
  const zero = getWebsiteJourneyPages(data, false, 'brentwood', 'enquiryPages');
  assert.equal(zero.status, 'available');
  assert.equal(zero.rows[0].count, 0);
  assert.equal(getWebsiteJourneyPages(data, false, 'radio-links', 'enquiryPages').status, 'not-connected');
  assert.equal(getWebsiteJourneyPages(data, false, 'idaro', 'enquiryPages').status, 'not-connected');
  assert.equal(getWebsiteJourneyPages(data, false, 'radio-links', 'topPages').status, 'not-connected');
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';

const bundled = await build({ entryPoints: ['src/utils/improvementSignals.ts'], bundle: true, platform: 'node', format: 'esm', write: false });
const { getWebsiteImprovementSignals } = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);

test('missing GA4 reports do not become zero traffic', () => {
  const result = getWebsiteImprovementSignals(null, ['brentwood']);
  assert.equal(result.status, 'not-connected');
  assert.equal(result.reportedSites, 0);
  assert.deepEqual(result.entries, []);
});

test('page reports stay separate and retain real zeros with explicit site coverage', () => {
  const result = getWebsiteImprovementSignals({ configured: true, brands: [
    { brand: 'brentwood', entryPages: [{ pagePath: '/', sessions: 120, engagedSessions: 60, bounceRate: 0.5 }], topPages: [{ pagePath: '/products', pageViews: 300 }], enquiryPages: [{ pagePath: '/contact', enquiries: 0 }] },
    { brand: 'capcom', entryPages: null, topPages: null, enquiryPages: null },
  ] }, ['brentwood', 'capcom']);
  assert.equal(result.status, 'available');
  assert.equal(result.reportedSites, 1);
  assert.equal(result.viewedReportedSites, 1);
  assert.equal(result.enquiryReportedSites, 1);
  assert.equal(result.selectedSites, 2);
  assert.equal(result.entries[0].sessions, 120);
  assert.deepEqual(result.viewed.map((row) => row.pagePath), ['/products']);
  assert.equal(result.enquiryActions[0].count, 0);
});

test('independent missing page reports stay unavailable when entry reporting succeeds', () => {
  const result = getWebsiteImprovementSignals({ configured: true, brands: [
    { brand: 'brentwood', entryPages: [], topPages: null, enquiryPages: null },
  ] }, ['brentwood']);
  assert.equal(result.status, 'available');
  assert.equal(result.reportedSites, 1);
  assert.equal(result.viewedReportedSites, 0);
  assert.equal(result.enquiryReportedSites, 0);
});

test('engagement watch is limited to busy entry pages, not one-session outliers', () => {
  const pages = Array.from({ length: 11 }, (_, index) => ({
    pagePath: `/p${index}`, sessions: 100 - index, engagedSessions: 50, bounceRate: index / 20,
  }));
  pages[10].sessions = 1;
  pages[10].bounceRate = 1;
  const result = getWebsiteImprovementSignals({ configured: true, brands: [
    { brand: 'brentwood', entryPages: pages, topPages: [], enquiryPages: [] },
  ] }, ['brentwood']);
  assert.ok(result.engagementWatch.every((row) => row.pagePath !== '/p10'));
});
